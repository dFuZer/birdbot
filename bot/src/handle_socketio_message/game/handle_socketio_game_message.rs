use futures_util::SinkExt;
use tokio_tungstenite::tungstenite::Message;

use crate::handle_socketio_message::{
    common::{handle_connect, handle_ping},
    parse::WebSocketMessageCtx,
};

use super::handle_game_message::{
    handle_correct_word, handle_next_turn, handle_set_milestone, handle_set_player_word,
    handle_setup,
};

pub async fn handle_socketio_game_message(ctx: &mut WebSocketMessageCtx<'_>) {
    match ctx.msg.event_type.as_str() {
        "connect" => handle_connect(ctx.write_socket).await,
        "sid" => handle_sid(ctx).await,
        "ping" => handle_ping(ctx.write_socket).await,
        "message" => handle_game_message(ctx).await,
        _ => println!("[game] Unknown socketio event type: {}", ctx.msg.event_type),
    }
}

pub async fn handle_sid(ctx: &mut WebSocketMessageCtx<'_>) {
    println!("[game] sent joinGame response");
    let state = &ctx.room_state;

    let response = format!(
        r#"42["joinGame","bombparty","{}","{}"]"#,
        state.room_code, state.user_token
    );
    ctx.write_socket
        .send(Message::Text(response.into()))
        .await
        .expect("Failed to send event");
}

pub async fn handle_game_message(ctx: &mut WebSocketMessageCtx<'_>) {
    let msg_type = ctx.msg.json[0].as_str().unwrap();

    match msg_type {
        "setup" => handle_setup(ctx).await,
        "nextTurn" => handle_next_turn(ctx).await,
        "setMilestone" => handle_set_milestone(ctx).await,
        "correctWord" => handle_correct_word(ctx).await,
        "setPlayerWord" => handle_set_player_word(ctx).await,
        e => println!("[game] Unknown message type: {}", e),
    }
}
