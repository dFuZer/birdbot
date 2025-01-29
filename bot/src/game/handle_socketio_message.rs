use super::handle_message;
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
    _msg: WebSocketMessage,
) {
    println!("[game] sent joinGame response");
    let state = &mut room_state.lock().await;

    let response = format!(
        r#"42["joinGame","bombparty","{}","{}"]"#,
        state.room_code, state.user_token
    );
    socket_write
        .send(Message::Text(response.into()))
        .await
        .expect("Failed to send event");
}

pub async fn handle_message(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let msg_type = msg.json[0].as_str().unwrap();

    match msg_type {
        "setup" => handle_message::handle_setup(socket_write, room_state, msg).await,
        "nextTurn" => handle_message::handle_next_turn(socket_write, room_state, msg).await,
        "setMilestone" => handle_message::handle_set_milestone(socket_write, room_state, msg).await,
        "correctWord" => handle_message::handle_correct_word(socket_write, room_state, msg).await,
        "setPlayerWord" => {
            handle_message::handle_set_player_word(socket_write, room_state, msg).await
        }
        e => println!("[game] Unknown message type: {}", e),
    }
}
