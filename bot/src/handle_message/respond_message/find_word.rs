use rand::Rng;

const DICTIONARY: [&str; 20] = [
    "authentification",
    "bibliotheque",
    "conversation",
    "developpement",
    "extraordinaire",
    "felicitations",
    "gouvernement",
    "hippopotame",
    "illumination",
    "journaliste",
    "kilometrage",
    "laboratoire",
    "manifestation",
    "negociation",
    "observation",
    "philosophie",
    "qualification",
    "refrigerateur",
    "surveillance",
    "telephone",
];

pub fn find_word(syllable: &str) -> Option<&str> {
    let syllable_upper = syllable;
    let dict_len = DICTIONARY.len();
    let starting_index = rand::thread_rng().gen_range(0..dict_len);
    for i in starting_index..dict_len {
        if DICTIONARY[i].contains(syllable_upper) {
            return Some(DICTIONARY[i]);
        }
    }
    for i in 0..starting_index {
        if DICTIONARY[i].contains(syllable_upper) {
            return Some(DICTIONARY[i]);
        }
    }
    None
}
