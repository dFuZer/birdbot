use crate::{socketio_parser::WebSocketMessage, RoomState};
use futures_util::stream::SplitSink;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

mod find_word;
mod handle_message;
mod handle_socketio_message;

pub async fn handle_socketio_message(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    if msg.event_type == "connect" {
        // Respond to connect event
        crate::common::handle_connect(socket_write, "room").await;
    } else if msg.event_type == "sid" {
        // Respond to SID event
        handle_socketio_message::handle_sid(socket_write, room_state, msg).await;
    } else if msg.event_type == "ping" {
        // Respond to ping event
        crate::common::handle_ping(socket_write, "room").await;
    } else if msg.event_type == "message" {
        // Handle message event
        handle_socketio_message::handle_message(socket_write, room_state, msg).await;
    }
}
