use super::super::parse_message::WebSocketMessage;
use crate::RoomState;
use futures_util::{stream::SplitSink, SinkExt};
use rand::Rng;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use tungstenite::protocol::Message;

const DICTIONARY: [&str; 239] = [
    "alieniste",
    "aligne",
    "alignement",
    "aligner",
    "aligot",
    "aligote",
    "aliment",
    "alimentaire",
    "alimentation",
    "alimenter",
    "alinea",
    "alise",
    "alisier",
    "alisme",
    "alitement",
    "aliter",
    "alizarine",
    "alize",
    "alize",
    "alizier",
    "alkekenge",
    "alkyle",
    "allaitement",
    "allaiter",
    "allant",
    "allantoïde",
    "allechant",
    "allecher",
    "allee",
    "allegation",
    "allège",
    "allegeance",
    "allegement",
    "allègement",
    "alleger",
    "allegorie",
    "allegorique",
    "allegoriquement",
    "allègre",
    "allegrement",
    "allègrement",
    "allegresse",
    "allegretto",
    "allegretto",
    "allegro",
    "allegro",
    "alleguer",
    "allèle",
    "allelique",
    "alleluia",
    "allemand",
    "aller",
    "aller et retour",
    "allergène",
    "allergenique",
    "allergie",
    "allergique",
    "allergisant",
    "allergologie",
    "allergologique",
    "allergologiste",
    "allergologue",
    "aller-retour",
    "alleu",
    "alliace",
    "alliage",
    "alliance",
    "allianciste",
    "allie",
    "allier",
    "alligator",
    "alliteration",
    "allium",
    "allo",
    "allo",
    "alloc",
    "allocataire",
    "allocation",
    "allochtone",
    "allocutaire",
    "allocution",
    "allogène",
    "allogreffe",
    "allonge",
    "allonge",
    "allongement",
    "allonger",
    "allopathe",
    "allopathie",
    "allophone",
    "allosexuel",
    "allouer",
    "allumage",
    "allume-cigare",
    "allume-cigarette",
    "allume-feu",
    "allume-gaz",
    "allumer",
    "allumette",
    "allumeur",
    "allumeuse",
    "allure",
    "allusif",
    "allusion",
    "alluvial",
    "alluvion",
    "alluvionnaire",
    "alluvionnement",
    "alluvionner",
    "alma mater",
    "almanach",
    "almandin",
    "almandine",
    "aloès",
    "aloi",
    "alopecie",
    "alors",
    "alose",
    "alouette",
    "alourdir",
    "alourdissement",
    "aloyau",
    "alpaca",
    "alpaga",
    "alpage",
    "alpax",
    "alpe",
    "alpestre",
    "alpha",
    "alphabet",
    "alphabetique",
    "alphabetiquement",
    "alphabetisation",
    "alphabetiser",
    "alphanumerique",
    "alpin",
    "alpinisme",
    "alpiniste",
    "alpiste",
    "alsacien",
    "alstroemère",
    "alstroemeria",
    "alstroemeria",
    "alstromère",
    "alstromeria",
    "alstromeria",
    "altaïque",
    "alter-",
    "alterable",
    "alterant",
    "alteration",
    "altercation",
    "alter ego",
    "alterer",
    "alterite",
    "altermondialisation",
    "altermondialisme",
    "altermondialiste",
    "alternance",
    "alternant",
    "alternateur",
    "alternatif",
    "alternative",
    "alternativement",
    "alterne",
    "alterner",
    "altersexuel",
    "altesse",
    "altier",
    "altimètre",
    "altiport",
    "altise",
    "altiste",
    "altitude",
    "alto",
    "altocumulus",
    "altostratus",
    "altruisme",
    "altruiste",
    "alucite",
    "aluminate",
    "alumine",
    "aluminer",
    "aluminerie",
    "alumineux",
    "aluminium",
    "aluminothermie",
    "alun",
    "alunir",
    "alunissage",
    "alveolaire",
    "alveole",
    "alveole",
    "alveolite",
    "alysse",
    "alysson",
    "alyssum",
    "alzheimer",
    "Am",
    "AM",
    "amabilite",
    "amadou",
    "amadouer",
    "amaigrir",
    "amaigrissant",
    "amaigrissement",
    "amalgamation",
    "amalgame",
    "amalgamer",
    "aman",
    "amancher",
    "amanchure",
    "amande",
    "amandier",
    "amandine",
    "amanite",
    "amant",
    "amarante",
    "amaranthe",
    "amaretto",
    "amaril",
    "amarone",
    "amarrage",
    "amarre",
    "amarrer",
    "amaryllis",
    "amas",
    "amasser",
    "amateur",
    "amateurisme",
    "à maxima",
    "amazone",
    "amazonien",
    "ambages",
    "ambassade",
    "ambassadeur",
    "ambi-",
    "ambiance",
    "ambiant",
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

pub async fn handle_sid(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    println!("[game] sent joinGame response");
    let state = &mut room_state.lock().await;

    let response = format!(
        r#"42["joinGame","bombparty","{}","{}"]"#,
        state.room_code, state.user_token
    );
    socket_write
        .send(Message::Text(response.into()))
        .await
        .expect("Failed to send event");
}

pub async fn handle_message(
    socket_write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    room_state: &Arc<Mutex<RoomState>>,
    msg: WebSocketMessage,
) {
    let state = &mut room_state.lock().await;
    let first_element = msg.json[0].clone();
    println!("[game] received message: {}", msg.json);
    if first_element == "setup" {
        println!("[game] received setup event");
        state.game_connected = true;
        socket_write
            .send(Message::Text(r#"42["joinRound"]"#.into()))
            .await
            .expect("Failed to send message");
    } else if first_element == "nextTurn" {
        let syllable = msg.json[2].as_str().expect("Failed to parse syllable");
        println!("[game] received nextTurn event. syllable: {}", syllable);
        let answer = find_word(syllable);
        match answer {
            Some(word) => {
                socket_write
                    .send(Message::Text(
                        format!(r#"42["setWord","{}",true]"#, word).into(),
                    ))
                    .await
                    .expect("Failed to send message");
            }
            None => {
                socket_write
                    .send(Message::Text(
                        r#"42["setWord","AUCUN MOT TROUVÉ",true]"#.into(),
                    ))
                    .await
                    .expect("Failed to send message");
            }
        }
    } else if first_element == "setMilestone" {
        let syllable = msg.json[1]["syllable"].as_str();
        match syllable {
            Some(s) => {
                println!("[game] received setMilestone event. syllable: {}", s);
                let answer = find_word(s);
                match answer {
                    Some(word) => {
                        socket_write
                            .send(Message::Text(
                                format!(r#"42["setWord","{}",true]"#, word).into(),
                            ))
                            .await
                            .expect("Failed to send message");
                    }
                    None => {
                        socket_write
                            .send(Message::Text(
                                r#"42["setWord","AUCUN MOT TROUVÉ",true]"#.into(),
                            ))
                            .await
                            .expect("Failed to send message");
                    }
                }
            }
            None => {
                println!("[game] received setMilestone event with no syllable. Joining game...");
                socket_write
                    .send(Message::Text(r#"42["joinRound"]"#.into()))
                    .await
                    .expect("Failed to send message");
            }
        }
    }
}
