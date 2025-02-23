use futures_util::SinkExt;
use serde_json::Value;
use tokio_tungstenite::tungstenite::Message;

use crate::{
    handle_socketio_message::parse::WebSocketMessageCtx,
    room::{Player, PlayerAuth},
    utils::{uwi32, uwstr},
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

fn extract_player_json(player_value: &Value) -> Player {
    let player_auth_struct: Option<PlayerAuth> = {
        let player_auth = player_value["profile"]["auth"].clone();
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

    Player {
        name: uwstr(&player_value["profile"]["nickname"], "nickname"),
        peer_id: uwi32(&player_value["profile"]["peerId"], "peerId"),
        auth: player_auth_struct,
    }
}

pub async fn handle_add_player(ctx: &mut WebSocketMessageCtx<'_>) {
    let player = extract_player_json(&ctx.msg.json[1]);
    ctx.room_state.players.push(player);
    println!(
        "[game] player ids: {:?}",
        ctx.room_state
            .players
            .iter()
            .map(|p| p.peer_id)
            .collect::<Vec<_>>()
    );
}

pub async fn handle_remove_player(ctx: &mut WebSocketMessageCtx<'_>) {
    let peer_id = uwi32(&ctx.msg.json[1], "peerId");
    ctx.room_state
        .players
        .retain(|player| player.peer_id != peer_id);
    println!(
        "[game] player ids: {:?}",
        ctx.room_state
            .players
            .iter()
            .map(|p| p.peer_id)
            .collect::<Vec<_>>()
    );
}

pub async fn handle_setup(ctx: &mut WebSocketMessageCtx<'_>) {
    println!("[game] received setup event");
    let players = ctx.msg.json[1]["players"]
        .as_array()
        .expect("Could not unwrap players");
    for player in players {
        let player = extract_player_json(player);
        ctx.room_state.players.push(player);
    }
    ctx.room_state.self_peer_id = uwi32(&ctx.msg.json[1]["selfPeerId"], "selfPeerId");
    ctx.room_state.game_connected = true;
    ctx.room_state.milestone_name = uwstr(&ctx.msg.json[1]["milestone"]["name"], "milestone name");
    ctx.write_socket
        .send(Message::Text(r#"42["joinRound"]"#.into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_next_turn(ctx: &mut WebSocketMessageCtx<'_>) {
    let player_peer_id = uwi32(&ctx.msg.json[1], "playerPeerId");
    let syllable = uwstr(&ctx.msg.json[2], "syllable");
    println!("[game] received nextTurn event. syllable: {}", syllable);
    ctx.room_state.current_player_peer_id = player_peer_id;
    if ctx.room_state.self_peer_id == player_peer_id {
        println!("[game] It's my turn! syllable: {}", syllable);
        try_send_word(ctx, &syllable).await;
    }
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
    let word = uwstr(&ctx.msg.json[2], "word");

    println!("lastword is: {}", word);

    ctx.room_state.last_word = word.to_string();
}

pub async fn handle_end_round(ctx: &mut WebSocketMessageCtx<'_>) {
    ctx.room_state.word_history.clear();
    ctx.room_state.players.clear();
    ctx.write_socket
        .send(Message::Text(r#"42["joinRound"]"#.into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_start_round(ctx: &mut WebSocketMessageCtx<'_>) {
    println!("[game] received round milestone.");
    let syllable = uwstr(&ctx.msg.json[1]["syllable"], "syllable");
    let player_peer_id = uwi32(
        &ctx.msg.json[1]["currentPlayerPeerId"],
        "currentPlayerPeerId",
    );
    ctx.room_state.current_player_peer_id = player_peer_id;
    if ctx.room_state.self_peer_id == player_peer_id {
        println!("[game] It's my turn! syllable: {}", syllable);
        try_send_word(ctx, &syllable).await;
    }
}

pub async fn handle_set_milestone(ctx: &mut WebSocketMessageCtx<'_>) {
    let tmp = uwstr(&ctx.msg.json[1]["name"], "milestone name");
    let milestone_name = tmp.as_str();
    let previous_milestone = ctx.room_state.milestone_name.clone();

    println!(
        "[game] received milestone event. milestone: {}",
        milestone_name
    );

    if previous_milestone != milestone_name {
        if milestone_name == "seating" {
            handle_end_round(ctx).await;
        } else if milestone_name == "round" {
            handle_start_round(ctx).await;
        }
    }

    ctx.room_state.milestone_name = milestone_name.to_string();
}
