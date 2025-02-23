use rand::Rng;
use serde_json::Value;

pub fn create_user_token() -> String {
    const DIGITS: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
    let mut rng = rand::rng();

    (0..16)
        .map(|_| {
            let idx = rng.random::<u8>() as usize % DIGITS.len();
            DIGITS.chars().nth(idx).unwrap()
        })
        .collect()
}

pub fn uwstr(value: &Value, value_name: &str) -> String {
    let v = value.as_str();
    match v {
        Some(v) => {
            let to_str = v.to_string();
            return to_str;
        }
        None => panic!("Could not unwrap {}", value_name),
    };
}

pub fn uwi32(value: &Value, value_name: &str) -> i32 {
    let v = value.as_i64();
    match v {
        Some(v) => {
            let n = v as i32;
            return n;
        }
        None => panic!("Could not unwrap {}", value_name),
    };
}
