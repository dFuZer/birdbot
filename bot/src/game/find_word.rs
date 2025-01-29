use crate::RoomState;
use rand::Rng;
use std::sync::Arc;
use tokio::sync::Mutex;

const DICTIONARY: [&str; 1] = ["anticonstitutionnellement"];

pub async fn find_word(room_state: &Arc<Mutex<RoomState>>, syllable: &str) -> Option<String> {
    let state = room_state.lock().await;
    let history = &state.word_history;
    let syllable_upper = syllable;
    let dict_len = DICTIONARY.len();
    let starting_index = rand::thread_rng().gen_range(0..dict_len);

    let is_valid = |word: &str| -> bool {
        if !word.contains(syllable_upper) || history.contains(&word.to_string()) {
            return false;
        }
        true
    };

    for i in starting_index..dict_len {
        if is_valid(DICTIONARY[i]) {
            return Some(DICTIONARY[i].to_string());
        }
    }
    for i in 0..starting_index {
        if is_valid(DICTIONARY[i]) {
            return Some(DICTIONARY[i].to_string());
        }
    }
    None
}
