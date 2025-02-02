use crate::handle_socketio_message::parse::WebSocketMessageCtx;
use rand::Rng;

pub fn find_word(ctx: &mut WebSocketMessageCtx<'_>, syllable: &str) -> Option<String> {
    let history = &ctx.room_state.word_history;
    let dictionary = &ctx.bot_resources.dictionary.list;
    let dict_len = dictionary.len();
    let starting_index = rand::rng().random_range(0..dict_len);

    let is_valid = |word: &str| -> bool {
        if !word.contains(syllable) || history.contains(&word.to_string()) {
            return false;
        }
        true
    };

    for i in starting_index..dict_len {
        if is_valid(&dictionary[i]) {
            return Some(dictionary[i].to_string());
        }
    }
    for i in 0..starting_index {
        if is_valid(&dictionary[i]) {
            return Some(dictionary[i].to_string());
        }
    }

    None
}
