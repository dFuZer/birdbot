use crate::{socketio_parser::WebSocketMessage, RoomState};
use futures_util::{stream::SplitSink, SinkExt};
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

pub async fn handle_sid(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
) {
    let state = &mut room_state.lock().await;
    println!(
        "[room] sending joinRoom response {}, {}",
        state.room_code, state.user_token
    );
    let response = format!(
        r#"420["joinRoom",{{"roomCode":"{}","userToken":"{}","nickname":"BirdBot","auth":null,"picture":"{}","language":"fr-FR"}}]"#,
        state.room_code, state.user_token, state.profile_pic
    );
    socket_write
        .send(Message::Text(response.into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_message(
    _socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    _room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let msg_type = msg.json[0].as_str().unwrap();

    match msg_type {
        e => println!("[game] Unknown message type: {}", e),
    }
}

pub async fn handle_room_entry(
    _socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    _msg: WebSocketMessage,
) {
    println!("[room] received setup message (Game is joined successfully)");
    room_state.lock().await.room_connected = true;
}
