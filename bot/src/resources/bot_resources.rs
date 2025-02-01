use super::dictionary::Dictionary;

pub struct BotResources {
    pub dictionary: Dictionary,
}

impl BotResources {
    pub fn new() -> Self {
        Self {
            dictionary: Dictionary::new(),
        }
    }
}
