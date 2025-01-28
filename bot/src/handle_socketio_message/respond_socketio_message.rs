mod socketio_common_handlers;
mod socketio_game_handlers;
mod socketio_room_handlers;

use super::parse_socketio_message::WebSocketMessage;
use crate::RoomState;
use futures_util::stream::SplitSink;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

pub async fn respond_message_room(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    if msg.event_type == "connect" {
        // Respond to connect event
        socketio_common_handlers::handle_connect(socket_write, "room").await;
    } else if msg.event_type == "sid" {
        // Respond to SID event
        socketio_room_handlers::handle_sid(socket_write, room_state).await;
    } else if msg.event_type == "ping" {
        // Respond to ping event
        socketio_common_handlers::handle_ping(socket_write, "room").await;
    } else if msg.event_type == "message" {
        // Handle message event
        socketio_room_handlers::handle_message(socket_write, room_state, msg).await;
    } else if msg.event_type == "roomEntry" {
        // Handle room entry event
        socketio_room_handlers::handle_room_entry(socket_write, room_state, msg).await;
    }
}

pub async fn respond_message_game(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    if msg.event_type == "connect" {
        // Respond to connect event
        socketio_common_handlers::handle_connect(socket_write, "room").await;
    } else if msg.event_type == "sid" {
        // Respond to SID event
        socketio_game_handlers::handle_sid(socket_write, room_state, msg).await;
    } else if msg.event_type == "ping" {
        // Respond to ping event
        socketio_common_handlers::handle_ping(socket_write, "room").await;
    } else if msg.event_type == "message" {
        // Handle message event
        socketio_game_handlers::handle_message(socket_write, room_state, msg).await;
    }
}
