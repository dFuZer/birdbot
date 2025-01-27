mod parse_socketio_message;
mod respond_message;

use std::sync::Arc;

use futures_util::stream::SplitSink;
use respond_message::{respond_message_game, respond_message_room};
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

use parse_socketio_message::parse_socketio_message;

pub async fn handle_message_room(
    msg: Message,
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<super::RoomState>>,
) {
    let parsed_message = parse_socketio_message(msg).expect("Failed to read message");
    println!(
        "[room] [{}]: {}",
        parsed_message.event_type, parsed_message.json
    );
    respond_message_room(socket_write, room_state, parsed_message).await;
}

pub async fn handle_message_game(
    msg: Message,
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &std::sync::Arc<tokio::sync::Mutex<super::RoomState>>,
) {
    let parsed_message = parse_socketio_message(msg).expect("Failed to read message");
    println!(
        "[game] [{}]: {}",
        parsed_message.event_type, parsed_message.json
    );
    respond_message_game(socket_write, room_state, parsed_message).await;
}
