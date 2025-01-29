use crate::{socketio_parser::WebSocketMessage, RoomState};
use futures_util::{stream::SplitSink, SinkExt};
use std::sync::Arc;
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

use super::find_word::find_word;

pub async fn try_send_word(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    syllable: &str,
) {
    let answer = find_word(room_state, syllable).await;
    match answer {
        Some(word) => {
            socket_write
                .send(Message::Text(
                    format!(r#"42["setWord","{}",true]"#, word).into(),
                ))
                .await
                .expect("Failed to send message");
        }
        None => {
            socket_write
                .send(Message::Text(r#"42["setWord","💥",true]"#.into()))
                .await
                .expect("Failed to send message");
        }
    }
}

pub async fn handle_setup(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    _msg: WebSocketMessage,
) {
    println!("[game] received setup event");
    room_state.lock().await.game_connected = true;
    socket_write
        .send(Message::Text(r#"42["joinRound"]"#.into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_next_turn(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let syllable = msg.json[2].as_str().unwrap();
    println!("[game] received nextTurn event. syllable: {}", syllable);
    try_send_word(socket_write, room_state, syllable).await;
}

pub async fn handle_correct_word(
    _socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    _msg: WebSocketMessage,
) {
    let mut state = room_state.lock().await;
    let word = state.last_word.clone();
    state.word_history.push(word);
    println!(
        "[game] received correctWord event. word: {}. history: {:?}",
        state.last_word, state.word_history
    );
}

pub async fn handle_set_player_word(
    _socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let word = msg.json[2].as_str().unwrap().to_string();
    let mut state = room_state.lock().await;
    println!("lastword is: {}", word);
    state.last_word = word;
}

pub async fn handle_set_milestone(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let syllable = msg.json[1]["syllable"].as_str();
    match syllable {
        Some(s) => {
            try_send_word(socket_write, room_state, s).await;
        }
        None => {
            println!("[game] received setMilestone event with no syllable. Joining game...");
            socket_write
                .send(Message::Text(r#"42["joinRound"]"#.into()))
                .await
                .expect("Failed to send message");
        }
    }
}
