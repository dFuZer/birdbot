use rand::Rng;

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
