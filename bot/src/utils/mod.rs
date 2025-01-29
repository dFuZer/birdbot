use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

pub async fn get_socket(url: &str) -> WebSocketStream<MaybeTlsStream<TcpStream>> {
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");
    println!("[connected to {}]", url);
    ws_stream
}
