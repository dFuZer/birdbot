use std::sync::Arc;
use std::time::Duration;
use std::vec;

use futures_util::StreamExt;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

use crate::handle_socketio_message::game::handle_socketio_game_message::handle_socketio_game_message;
use crate::handle_socketio_message::parse::{socket_io_parse_message, WebSocketMessageCtx};
use crate::handle_socketio_message::room::handle_socketio_room_message::handle_socketio_room_message;
use crate::resources::bot_resources::BotResources;
use crate::room::Room;

pub struct Bot {
    pub resources: Arc<Mutex<BotResources>>,
    pub rooms: Vec<Room>,
}

impl Bot {
    pub async fn new() -> Self {
        let rooms = vec![];
        return Self {
            resources: Arc::new(Mutex::new(BotResources::new())),
            rooms: rooms,
        };
    }

    pub async fn init(&mut self) {
        let mut res = self.resources.lock().await;
        res.dictionary.load("./resources/fr.txt");
    }

    pub async fn add_room(&mut self, room_code: &str) {
        let room = Room::new(room_code).await;
        self.rooms.push(room);
    }

    pub fn listen_rooms(&mut self) -> Vec<JoinHandle<()>> {
        let mut handles: Vec<JoinHandle<()>> = vec![];
        for room in &self.rooms {
            {
                let room_socket_clone = room.room_socket.clone();
                let bot_resources = self.resources.clone();
                let room_state = room.room_state.clone();
                let room_handle = tokio::spawn(async move {
                    let mut locked_socket = room_socket_clone.lock().await;
                    while let Some(msg) = locked_socket.read.next().await {
                        match msg {
                            Ok(msg) => {
                                let mut bot_resources = bot_resources.lock().await;
                                let mut room_state = room_state.lock().await;
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
                });
                handles.push(room_handle);
            }
            {
                let game_socket_clone = room.game_socket.clone();
                let bot_resources = self.resources.clone();
                let room_state = room.room_state.clone();
                let game_handle = tokio::spawn(async move {
                    loop {
                        let room_state = room_state.lock().await;
                        if room_state.room_connected {
                            println!("Room is connected, connecting game socket...");
                            break;
                        }
                        drop(room_state);
                        tokio::time::sleep(Duration::from_millis(100)).await;
                    }
                    let mut locked_socket = game_socket_clone.lock().await;
                    while let Some(msg) = locked_socket.read.next().await {
                        match msg {
                            Ok(msg) => {
                                let mut bot_resources = bot_resources.lock().await;
                                let mut room_state = room_state.lock().await;
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
                });
                handles.push(game_handle);
            }
        }
        return handles;
    }
}
