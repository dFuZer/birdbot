use futures_util::{stream::SplitSink, SinkExt};
use tokio::net::TcpStream;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

pub async fn handle_connect(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    environment: &str,
) {
    println!("[{}] sent connect response", environment);
    socket_write
        .send(Message::Text("40".into()))
        .await
        .expect("Failed to send message");
}
pub async fn handle_ping(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    environment: &str,
) {
    println!("[{}] sent pong", environment);
    socket_write
        .send(Message::Text("3".into()))
        .await
        .expect("Failed to send message");
}
