use super::super::parse_socketio_message::WebSocketMessage;
use crate::RoomState;
use futures_util::{stream::SplitSink, SinkExt};
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

mod message_room_handlers;

pub async fn handle_sid(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
) {
    println!("[room] sending joinRoom response");
    let state = &mut room_state.lock().await;
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
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let msg_type = msg.json[0].as_str().unwrap();

    match msg_type {
        e => println!("[game] Unknown message type: {}", e),
    }
}

pub async fn handle_room_entry(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    println!("[room] received setup message (Game is joined successfully)");
    room_state.lock().await.room_connected = true;
}
