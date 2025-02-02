use std::sync::Arc;
use std::vec;

use tokio::sync::Mutex;

use crate::resources::bot_resources::BotResources;
use crate::room::Room;

pub struct Bot {
    pub resources: Arc<Mutex<BotResources>>,
    pub rooms: Vec<Room>,
}

impl Bot {
    pub async fn new() -> Self {
        let rooms = vec![];
        return Self {
            resources: Arc::new(Mutex::new(BotResources::new())),
            rooms: rooms,
        };
    }

    pub async fn init(&mut self) {
        let mut res = self.resources.lock().await;
        res.dictionary.load("./resources/fr.txt");
    }

    pub async fn add_room(&mut self, room_code: &str) {
        let resources = self.resources.clone();
        let room = Room::new(room_code, resources).await;
        self.rooms.push(room);
    }
}
