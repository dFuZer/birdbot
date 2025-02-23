use std::{sync::Arc, time::Duration};

use futures_util::StreamExt;
use tokio::{sync::Mutex, task::JoinHandle};

use crate::{
    handle_socketio_message::{
        game::handle_socketio_game_message::{self, handle_socketio_game_message},
        parse::{socket_io_parse_message, WebSocketMessageCtx},
        room::handle_socketio_room_message::handle_socketio_room_message,
    },
    resources::bot_resources::BotResources,
    socket::Socket,
    utils::create_user_token,
    PROFILE_PIC,
};

pub struct Player {
    pub peer_id: i32,
    pub name: String,
    pub auth: Option<PlayerAuth>,
}

pub struct PlayerAuth {
    pub auth_id: String,
    pub auth_name: String,
    pub auth_provider: String,
}

pub struct RoomState {
    pub room_connected: bool,
    pub game_connected: bool,
    pub room_code: String,
    pub user_token: String,
    pub profile_pic: String,
    pub word_history: Vec<String>,
    pub last_word: String,
    pub players: Vec<Player>,
    pub current_player_peer_id: i32,
    pub self_peer_id: i32,
    pub milestone_name: String,
}

pub struct Room {
    pub room_socket: Arc<Mutex<Socket>>,
    pub game_socket: Arc<Mutex<Socket>>,
    pub room_thread_handle: JoinHandle<()>,
    pub game_thread_handle: JoinHandle<()>,
    pub room_state: Arc<Mutex<RoomState>>,
}

impl Room {
    pub async fn new(room_code: &str, bot_resources: Arc<Mutex<BotResources>>) -> Self {
        let room_state_original = Arc::new(Mutex::new(RoomState {
            game_connected: false,
            room_connected: false,
            last_word: "".to_string(),
            profile_pic: PROFILE_PIC.to_string(),
            room_code: room_code.to_string(),
            word_history: vec![],
            user_token: create_user_token().to_string(),
            players: vec![],
            current_player_peer_id: 0,
            self_peer_id: 0,
            milestone_name: "".to_string(),
        }));

        let room_socket = Arc::new(Mutex::new(Socket::new(room_code).await));
        let game_socket = Arc::new(Mutex::new(Socket::new(room_code).await));

        let room_state_clone_room = room_state_original.clone();
        let room_state_clone_game = room_state_original.clone();

        let room_handle = {
            let room_socket_clone = room_socket.clone();
            let bot_resources_clone = bot_resources.clone();
            tokio::spawn(async move {
                let mut locked_socket = room_socket_clone.lock().await;
                while let Some(msg) = locked_socket.read.next().await {
                    match msg {
                        Ok(msg) => {
                            let mut bot_resources = bot_resources_clone.lock().await;
                            let mut room_state = room_state_clone_room.lock().await;
                            let mut parsed_msg = socket_io_parse_message(&msg)
                                .await
                                .expect("Could not parse message");

                            let mut context = WebSocketMessageCtx {
                                msg: &mut parsed_msg,
                                bot_resources: &mut bot_resources,
                                room_state: &mut room_state,
                                write_socket: &mut locked_socket.write,
                            };
                            handle_socketio_room_message(&mut context).await;
                        }
                        Err(e) => println!("[room socket error] {:?}", e),
                    }
                }
            })
        };
        let game_handle = {
            let game_socket_clone = game_socket.clone();
            let bot_resources_clone = bot_resources.clone();
            tokio::spawn(async move {
                loop {
                    let room_state = room_state_clone_game.lock().await;
                    if room_state.room_connected {
                        println!("Room is connected, connecting game socket...");
                        break;
                    }
                    drop(room_state);
                    tokio::time::sleep(Duration::from_millis(50)).await;
                }
                let mut locked_socket = game_socket_clone.lock().await;
                while let Some(msg) = locked_socket.read.next().await {
                    match msg {
                        Ok(msg) => {
                            let mut bot_resources = bot_resources_clone.lock().await;
                            let mut room_state = room_state_clone_game.lock().await;
                            let mut parsed_msg = socket_io_parse_message(&msg)
                                .await
                                .expect("Could not parse message");

                            let mut context = WebSocketMessageCtx {
                                msg: &mut parsed_msg,
                                bot_resources: &mut bot_resources,
                                room_state: &mut room_state,
                                write_socket: &mut locked_socket.write,
                            };

                            handle_socketio_game_message(&mut context).await;
                        }
                        Err(e) => println!("[game socket error] {:?}", e),
                    }
                }
            })
        };

        return Self {
            room_state: room_state_original,
            game_thread_handle: game_handle,
            room_thread_handle: room_handle,
            room_socket,
            game_socket,
        };
    }
}
