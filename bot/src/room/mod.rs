use std::sync::Arc;

use futures_util::stream::SplitSink;
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::Message;

use crate::{socketio_parser::WebSocketMessage, RoomState};

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
        handle_socketio_message::handle_sid(socket_write, room_state).await;
    } else if msg.event_type == "ping" {
        // Respond to ping event
        crate::common::handle_ping(socket_write, "room").await;
    } else if msg.event_type == "message" {
        // Handle message event
        handle_socketio_message::handle_message(socket_write, room_state, msg).await;
    } else if msg.event_type == "roomEntry" {
        // Handle room entry event
        handle_socketio_message::handle_room_entry(socket_write, room_state, msg).await;
    }
}
