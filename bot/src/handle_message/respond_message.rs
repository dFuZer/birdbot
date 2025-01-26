use std::sync::Arc;

use crate::RoomState;

mod find_word;

use super::parse_message::WebSocketMessage;

use find_word::find_word;
use futures_util::{stream::SplitSink, SinkExt};
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};

use tokio::net::TcpStream;
use tungstenite::protocol::Message;

pub async fn respond_message_room(
    msg: WebSocketMessage,
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
) {
    let state = &mut room_state.lock().await;

    if msg.event_type == "connect" {
        // Respond to connect event
        socket_write
            .send(Message::Text("40".into()))
            .await
            .expect("Failed to send message");
        println!("[room] sent connect response");
    } else if msg.event_type == "sid" {
        // Respond to SID event
        let response = format!(
            r#"420["joinRoom",{{"roomCode":"{}","userToken":"{}","nickname":"BirdBot","auth":null,"picture":"{}","language":"fr-FR"}}]"#,
            state.room_code, state.user_token, state.profile_pic
        );
        println!("[room] sending joinRoom response");
        socket_write
            .send(Message::Text(response.into()))
            .await
            .expect("Failed to send message");
    } else if msg.event_type == "ping" {
        // Respond to ping event
        socket_write
            .send(Message::Text("3".into()))
            .await
            .expect("Failed to send message");
        println!("[room] sent pong");
    } else if msg.event_type == "message" {
        // Handle message event
        println!("[room] received message: {}", msg.json);
    } else if msg.event_type == "roomEntry" {
        // Handle room entry event
        println!("[room] received setup message (Game is joined successfully)");
        state.room_connected = true;
    }
}

pub async fn respond_message_game(
    msg: WebSocketMessage,
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
) {
    let state = &mut room_state.lock().await;
    if msg.event_type == "connect" {
        // Respond to connect event
        socket_write
            .send(Message::Text("40".into()))
            .await
            .expect("Failed to send message");
        println!("[game] sent connect response");
    } else if msg.event_type == "sid" {
        // Respond to SID event
        let response = format!(
            r#"42["joinGame","bombparty","{}","{}"]"#,
            state.room_code, state.user_token
        );
        socket_write
            .send(Message::Text(response.into()))
            .await
            .expect("Failed to send event");
        println!("[game] sent joinGame response");
    } else if msg.event_type == "ping" {
        // Respond to ping event
        socket_write
            .send(Message::Text("3".into()))
            .await
            .expect("Failed to send event");
        println!("[game] sent pong");
    } else if msg.event_type == "message" {
        // Handle message event
        let first_element = msg.json[0].clone();
        println!("[game] received message: {}", msg.json);
        if first_element == "setup" {
            println!("[game] received setup event");
            state.game_connected = true;
            socket_write
                .send(Message::Text(r#"42["joinRound"]"#.into()))
                .await
                .expect("Failed to send message");
        } else if first_element == "nextTurn" {
            let syllable = msg.json[2].as_str().expect("Failed to parse syllable");
            println!("[game] received nextTurn event. syllable: {}", syllable);
            let answer = find_word(syllable);
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
        } else if first_element == "setMilestone" {
            let syllable = msg.json[1]["syllable"].as_str();
            match syllable {
                Some(s) => {
                    println!("[game] received setMilestone event. syllable: {}", s);
                    let answer = find_word(s);
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
                    println!(
                        "[game] received setMilestone event with no syllable. Joining game..."
                    );
                    socket_write
                        .send(Message::Text(r#"42["joinRound"]"#.into()))
                        .await
                        .expect("Failed to send message");
                }
            }
        }
    }
}
