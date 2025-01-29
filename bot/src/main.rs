mod common;
mod game;
mod room;
mod socketio_parser;
mod utils;

use env_logger;
use futures_util::StreamExt;
use serde_json::{Result, Value};
use std::env;
use std::sync::Arc;
use tokio::sync::Mutex;
use utils::get_socket;

struct RoomState {
    room_connected: bool,
    game_connected: bool,
    room_code: String,
    user_token: String,
    profile_pic: String,
    word_history: Vec<String>,
    last_word: String,
}

async fn get_room_game_ws_url(room_code: &str) -> Result<String> {
    let request_client = reqwest::Client::new();

    let request_res = request_client
        .post("https://jklm.fun/api/joinRoom")
        .header("content-type", "application/json")
        .body(format!(r#"{{"roomCode":"{}"}}"#, room_code))
        .send()
        .await
        .expect("Could not get connection URL from joinRoom API")
        .text()
        .await
        .expect("Could convert the joinRoom API response to text");

    let json_res: Value = serde_json::from_str(&request_res)
        .expect("Could not deserialize JSON from the joinRoom API response");

    let mut url = json_res["url"]
        .as_str()
        .expect("Could not extract URL from the JSON sent by the joinRoom response")
        .replace("https", "wss");
    url.push_str("/socket.io/?EIO=4&transport=websocket");

    return Ok(url.to_string());
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let args: Vec<String> = env::args().collect();
    let room_code = args[1].clone();

    if room_code.chars().count() != 4 {
        panic!("No valid room code was given")
    }

    let connection_url = get_room_game_ws_url(&room_code).await.expect("");

    println!("connection url: {}", connection_url);

    let room_state = Arc::new(Mutex::new(RoomState {
        room_connected: false,
        game_connected: false,
        room_code: room_code,
        user_token: "K3GJW268IxM4cH22".to_string(),
        profile_pic: "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".to_string(),
        word_history: vec![],
        last_word: "".to_string(),
    }));

    let (mut write_room, mut read_room) = get_socket(&connection_url).await.split();

    // Read room messages
    let room_handle = {
        let room_state_clone = Arc::clone(&room_state);
        tokio::spawn(async move {
            while let Some(msg) = read_room.next().await {
                match msg {
                    Ok(msg) => {
                        let parsed =
                            socketio_parser::parse_socketio_message(msg).expect("Could not parse");
                        room::handle_socketio_message(&mut write_room, &room_state_clone, parsed)
                            .await;
                    }
                    Err(e) => println!("[room socket error] {:?}", e),
                }
            }
        })
    };

    // Read game messages
    let game_handle = {
        let room_state_clone = Arc::clone(&room_state);

        tokio::spawn(async move {
            // Wait for notification
            loop {
                // Check the condition under the lock

                let state = room_state_clone.lock().await;
                if state.room_connected {
                    break;
                }

                // Wait for the notify signal
            }

            // Room is connected, now create the game socket
            println!("[room connected, creating game socket]");
            let (mut write_game, mut read_game) = get_socket(&connection_url).await.split();

            // Read game messages
            while let Some(msg) = read_game.next().await {
                match msg {
                    Ok(msg) => {
                        let parsed =
                            socketio_parser::parse_socketio_message(msg).expect("Could not parse");
                        game::handle_socketio_message(&mut write_game, &room_state_clone, parsed)
                            .await;
                    }
                    Err(e) => println!("[room socket error] {:?}", e),
                }
            }
        })
    };

    // Task to log the room_state object every 5 seconds
    let _ = {
        let room_state_clone = Arc::clone(&room_state);
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
            loop {
                interval.tick().await;

                println!(
                    "RoomState: {}",
                    room_state_clone.lock().await.room_connected
                );
            }
        })
    };

    // Wait for both tasks to complete
    let _ = tokio::try_join!(game_handle, room_handle);
}
