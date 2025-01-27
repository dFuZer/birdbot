use serde_json::{Result, Value};
use tungstenite::protocol::Message;

pub struct WebSocketMessage {
    pub event_type: String,
    pub json: Value,
}

pub fn parse_socketio_message(msg: Message) -> Result<WebSocketMessage> {
    match msg {
        Message::Text(text) => {
            let str = text.to_string();
            let mut i = 0;
            for c in str.chars() {
                if c.is_ascii_digit() {
                    i += 1;
                } else {
                    break;
                }
            }
            let json_str = &str[i..];
            let event_type = &str[..i];
            if event_type == "0" {
                // Connect event
                let parse_result: Value = serde_json::from_str(json_str)?;
                return Ok({
                    WebSocketMessage {
                        event_type: "connect".to_string(),
                        json: parse_result,
                    }
                });
            } else if event_type == "40" {
                // SID event
                let parse_result: Value = serde_json::from_str(json_str)?;
                return Ok({
                    WebSocketMessage {
                        event_type: "sid".to_string(),
                        json: parse_result,
                    }
                });
            } else if event_type == "430" {
                // Room entry event
                let parse_result: Value = serde_json::from_str(json_str)?;
                return Ok({
                    WebSocketMessage {
                        event_type: "roomEntry".to_string(),
                        json: parse_result,
                    }
                });
            } else if event_type == "2" {
                // Ping event
                return Ok({
                    WebSocketMessage {
                        event_type: "ping".to_string(),
                        json: Value::Null,
                    }
                });
            } else if event_type == "42" {
                // Message event
                let parse_result: Value = serde_json::from_str(json_str)?;
                return Ok({
                    WebSocketMessage {
                        event_type: "message".to_string(),
                        json: parse_result,
                    }
                });
            } else if event_type == "41" {
                // Disconnect event
                return Ok({
                    WebSocketMessage {
                        event_type: "disconnect".to_string(),
                        json: Value::Null,
                    }
                });
            }
            println!("COULD NOT PARSE: ");
            println!("Event Type: {}", event_type);
            println!("JSON: {}", json_str);
            panic!("Event not implemented");
        }
        Message::Binary(_) => panic!("Binary messages not implemented"),
        Message::Ping(_) => panic!("Ping messages not implemented"),
        Message::Pong(_) => panic!("Pong messages not implemented"),
        Message::Close(_) => Ok({
            WebSocketMessage {
                event_type: "disconnect".to_string(),
                json: Value::Null,
            }
        }),
        Message::Frame(_) => panic!("Frame messages not implemented"),
    }
}
