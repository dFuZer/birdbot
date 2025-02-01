use std::sync::Arc;

use tokio::sync::Mutex;

use crate::{socket, utils::create_user_token, PROFILE_PIC};

pub struct RoomState {
    pub room_connected: bool,
    pub game_connected: bool,
    pub room_code: String,
    pub user_token: String,
    pub profile_pic: String,
    pub word_history: Vec<String>,
    pub last_word: String,
}

pub struct Room {
    pub room_socket: Arc<Mutex<socket::Socket>>,
    pub game_socket: Arc<Mutex<socket::Socket>>,
    pub room_state: Arc<Mutex<RoomState>>,
}

impl Room {
    pub async fn new(room_code: &str) -> Self {
        return Self {
            room_state: Arc::new(Mutex::new(RoomState {
                game_connected: false,
                room_connected: false,
                last_word: "".to_string(),
                profile_pic: PROFILE_PIC.to_string(),
                room_code: room_code.to_string(),
                word_history: vec![],
                user_token: create_user_token().to_string(),
            })),
            room_socket: Arc::new(Mutex::new(socket::Socket::new(room_code).await)),
            game_socket: Arc::new(Mutex::new(socket::Socket::new(room_code).await)),
        };
    }
}
