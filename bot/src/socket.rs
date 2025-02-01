use futures_util::{
    stream::{SplitSink, SplitStream},
    StreamExt,
};

use serde_json::{Result, Value};
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};

pub struct Socket {
    pub read: ReadSocket,
    pub write: WriteSocket,
}

pub type ReadSocket = SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>;
pub type WriteSocket = SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>;

impl Socket {
    pub async fn get_url_for_room(room_code: &str) -> Result<String> {
        let request_client = reqwest::Client::new();

        let request_res = request_client
            .post("https://jklm.fun/api/joinRoom")
            .header("content-type", "application/json")
            .body(format!(r#"{{"roomCode":"{}"}}"#, room_code))
            .send()
            .await
            .expect("Could not get connection URL from joinRoom API")
            .text()
            .await
            .expect("Could convert the joinRoom API response to text");

        let json_res: Value = serde_json::from_str(&request_res)
            .expect("Could not deserialize JSON from the joinRoom API response");

        let mut url = json_res["url"]
            .as_str()
            .expect("Could not extract URL from the JSON sent by the joinRoom response")
            .replace("https", "wss");
        url.push_str("/socket.io/?EIO=4&transport=websocket");

        return Ok(url.to_string());
    }

    pub async fn new(room_code: &str) -> Self {
        let url = Self::get_url_for_room(room_code)
            .await
            .expect("Could not get URL for room");

        let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");

        let (write_room, read_room) = ws_stream.split();

        return Socket {
            read: read_room,
            write: write_room,
        };
    }
}
