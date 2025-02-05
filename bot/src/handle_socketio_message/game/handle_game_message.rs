use futures_util::SinkExt;
use tokio_tungstenite::tungstenite::Message;

use crate::{
    handle_socketio_message::parse::WebSocketMessageCtx,
    room::{Player, PlayerAuth},
};

use super::find_word::find_word;

pub async fn try_send_word(ctx: &mut WebSocketMessageCtx<'_>, syllable: &str) {
    let answer = find_word(ctx, syllable);

    match answer {
        Some(word) => {
            ctx.write_socket
                .send(Message::Text(
                    format!(r#"42["setWord","{}",true]"#, word).into(),
                ))
                .await
                .expect("Failed to send message");
        }
        None => {
            ctx.write_socket
                .send(Message::Text(r#"42["setWord","💥",true]"#.into()))
                .await
                .expect("Failed to send message");
        }
    }
}

pub async fn handle_setup(ctx: &mut WebSocketMessageCtx<'_>) {
    println!("[game] received setup event");
    println!("[game] game data: {:?}", ctx.msg.json[1]);
    let players = ctx.msg.json[1]["players"]
        .as_array()
        .expect("Could not unwrap players");
    for player in players {
        let mut player_auth_struct: Option<PlayerAuth> = {
            let player_auth = player["profile"]["auth"].clone();
            if player_auth.is_null() {
                None
            } else {
                Some(PlayerAuth {
                    auth_id: player_auth["id"]
                        .as_str()
                        .expect("Could not unwrap authId")
                        .to_string(),
                    auth_name: player_auth["username"]
                        .as_str()
                        .expect("Could not unwrap name")
                        .to_string(),
                    auth_provider: player_auth["service"]
                        .as_str()
                        .expect("Could not unwrap provider")
                        .to_string(),
                })
            }
        };

        let player = Player {
            name: player["profile"]["nickname"]
                .as_str()
                .expect("Could not unwrap nickname")
                .to_string(),
            peer_id: player["profile"]["peerId"]
                .as_i64()
                .expect("Could not unwrap peerId") as i32,
            auth: player_auth_struct,
        };

        ctx.room_state.players.push(player);
    }
    ctx.room_state.game_connected = true;
    ctx.write_socket
        .send(Message::Text(r#"42["joinRound"]"#.into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_next_turn(ctx: &mut WebSocketMessageCtx<'_>) {
    let syllable = ctx.msg.json[2].as_str().unwrap().to_string();
    println!("[game] received nextTurn event. syllable: {}", syllable);
    try_send_word(ctx, &syllable).await;
}

pub async fn handle_correct_word(ctx: &mut WebSocketMessageCtx<'_>) {
    let state = &mut ctx.room_state;
    let word = state.last_word.clone();
    state.word_history.push(word);
    println!(
        "[game] received correctWord event. word: {}. history: {:?}",
        state.last_word, state.word_history
    );
}

pub async fn handle_set_player_word(ctx: &mut WebSocketMessageCtx<'_>) {
    let word = &ctx.msg.json[2].as_str().unwrap().to_string();
    println!("lastword is: {}", word);
    ctx.room_state.last_word = word.to_string();
}

pub async fn handle_set_milestone(ctx: &mut WebSocketMessageCtx<'_>) {
    let syllable = ctx.msg.json[1]["syllable"].as_str().map(String::from);
    match syllable {
        Some(s) => {
            try_send_word(ctx, &s).await;
        }
        None => {
            println!("[game] received setMilestone event with no syllable. Joining game...");
            ctx.write_socket
                .send(Message::Text(r#"42["joinRound"]"#.into()))
                .await
                .expect("Failed to send message");
        }
    }
}
