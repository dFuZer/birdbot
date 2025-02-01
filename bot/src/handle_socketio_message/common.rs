use futures_util::SinkExt;
use tokio_tungstenite::tungstenite::Message;

use crate::socket::WriteSocket;

pub async fn handle_ping(write: &mut WriteSocket) -> () {
    write
        .send(Message::Text("3".into()))
        .await
        .expect("Failed to send message");
}

pub async fn handle_connect(write: &mut WriteSocket) -> () {
    write
        .send(Message::Text("40".into()))
        .await
        .expect("Failed to send message");
}
