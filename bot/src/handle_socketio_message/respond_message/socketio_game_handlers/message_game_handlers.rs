use std::sync::Arc;

use super::super::super::parse_socketio_message::WebSocketMessage;
use crate::RoomState;
use futures_util::{stream::SplitSink, SinkExt};
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

mod find_word;

pub async fn handle_setup(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
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
    let answer = find_word::find_word(syllable);
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
                .send(Message::Text(
                    r#"42["setWord","AUCUN MOT TROUVÉ",true]"#.into(),
                ))
                .await
                .expect("Failed to send message");
        }
    }
}

pub async fn handle_set_milestone(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let syllable = msg.json[1]["syllable"].as_str();
    match syllable {
        Some(s) => {
            println!("[game] received setMilestone event. syllable: {}", s);
            let answer = find_word::find_word(s);
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
                        .send(Message::Text(
                            r#"42["setWord","AUCUN MOT TROUVÉ",true]"#.into(),
                        ))
                        .await
                        .expect("Failed to send message");
                }
            }
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
