use futures_util::SinkExt;
use tokio_tungstenite::tungstenite::Message;

use crate::handle_socketio_message::{
    common::{handle_connect, handle_ping},
    parse::WebSocketMessageCtx,
};

pub async fn handle_socketio_room_message(ctx: &mut WebSocketMessageCtx<'_>) {
    match ctx.msg.event_type.as_str() {
        "connect" => handle_connect(ctx.write_socket).await,
        "ping" => handle_ping(ctx.write_socket).await,
        "sid" => handle_sid(ctx).await,
        "message" => handle_room_message(ctx).await,
        "roomEntry" => handle_room_entry(ctx).await,
        _ => println!("[room] Unknown socketio event type: {}", ctx.msg.event_type),
    }
}

pub async fn handle_sid(ctx: &mut WebSocketMessageCtx<'_>) {
    let state = &ctx.room_state;
    println!(
        "[room] sending joinRoom response {}, {}",
        state.room_code, state.user_token
    );
    let response = format!(
        r#"420["joinRoom",{{"roomCode":"{}","userToken":"{}","nickname":"BirdBot","auth":null,"picture":"{}","language":"fr-FR"}}]"#,
        state.room_code, state.user_token, state.profile_pic
    );
    ctx.write_socket
        .send(Message::Text(response.into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_room_message(ctx: &mut WebSocketMessageCtx<'_>) {
    let msg_type = ctx.msg.json[0].as_str().unwrap();

    match msg_type {
        e => println!("[room] Unknown message type: {}", e),
    }
}

pub async fn handle_room_entry(ctx: &mut WebSocketMessageCtx<'_>) {
    println!("[room] received setup message (Game is joined successfully)");
    ctx.room_state.room_connected = true;
}
