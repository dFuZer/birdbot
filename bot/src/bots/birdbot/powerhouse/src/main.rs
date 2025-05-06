use rayon::prelude::*;
use serde_json;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::collections::HashSet;
use std::env;
use std::fs::File;
use std::io::{self, BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process;
use std::time::Instant;

fn read_words_from_dictionary(file_path: &str) -> io::Result<Vec<String>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);

    // Let Vec grow naturally - the performance impact is minimal compared to I/O
    let mut words = Vec::new();

    for line in reader.lines() {
        words.push(line?);
    }

    Ok(words)
}

fn get_letter_rarity_scores(dictionary: &[String], bonus_letters: &str) -> HashMap<char, f64> {
    // Keep this capacity as it's small and known
    let mut letter_rarity_scores: HashMap<char, f64> = HashMap::with_capacity(bonus_letters.len());

    // Create a HashSet for O(1) lookups
    let bonus_letters_set: HashSet<char> = bonus_letters.chars().collect();

    // Count letters in a single pass
    for word in dictionary {
        for letter in word.chars() {
            if bonus_letters_set.contains(&letter) {
                *letter_rarity_scores.entry(letter).or_insert(0.0) += 1.0;
            }
        }
    }

    // Find minimum letter count
    let min_letters = letter_rarity_scores
        .values()
        .copied()
        .fold(f64::INFINITY, f64::min);

    // Calculate and normalize scores in a single pass
    let mut min_score = f64::INFINITY;
    for score in letter_rarity_scores.values_mut() {
        *score = (1.0 / (*score / min_letters)).powf(0.6);
        min_score = min_score.min(*score);
    }

    // Final normalization
    for score in letter_rarity_scores.values_mut() {
        *score = (*score / min_score * 100.0).round() / 100.0;
    }

    letter_rarity_scores
}

fn split_word_into_valid_subwords(word: &str) -> Vec<String> {
    // Keep this capacity as it's based on the word length
    let mut result = Vec::with_capacity(word.len() / 2);
    let mut start_index = 0;

    // Use bytes instead of chars for faster iteration
    for (i, byte) in word.bytes().enumerate() {
        if byte == b'\'' || byte == b'-' {
            let sub_len = i - start_index;
            if sub_len > 1 {
                result.push(word[start_index..i].to_string());
            }
            start_index = i + 1;
        }
    }

    // Handle the last subword if needed
    let sub_len = word.len() - start_index;
    if sub_len > 1 {
        result.push(word[start_index..].to_string());
    }

    result
}

fn split_word_into_syllables(word: &str) -> HashMap<String, i32> {
    let subwords = split_word_into_valid_subwords(word);
    // Keep this capacity as it's based on the word length
    let mut syllables: HashMap<String, i32> = HashMap::with_capacity(word.len());

    for subword in subwords {
        let bytes = subword.as_bytes();
        let subword_len = bytes.len();

        // Process 2-letter syllables
        if subword_len >= 2 {
            for i in 0..=subword_len - 2 {
                let syllable = unsafe { std::str::from_utf8_unchecked(&bytes[i..i + 2]) };
                *syllables.entry(syllable.to_string()).or_insert(0) += 1;
            }
        }

        // Process 3-letter syllables
        if subword_len >= 3 {
            for i in 0..=subword_len - 3 {
                let syllable = unsafe { std::str::from_utf8_unchecked(&bytes[i..i + 3]) };
                *syllables.entry(syllable.to_string()).or_insert(0) += 1;
            }
        }
    }

    syllables
}

fn get_syllables_count(dictionary: &[String]) -> HashMap<String, i32> {
    // Remove capacity as it's hard to predict the number of unique syllables
    let mut syllables_count: HashMap<String, i32> = HashMap::new();

    for word in dictionary {
        let syllables = split_word_into_syllables(word);
        for (syllable, count) in syllables {
            *syllables_count.entry(syllable).or_insert(0) += count;
        }
    }

    syllables_count
}

fn evaluate_flip_word(
    word: &str,
    letter_rarity_scores: &HashMap<char, f64>,
    necessary_letters: &str,
) -> f64 {
    let mut score = 0.0;
    // Create a HashSet for O(1) lookups
    let necessary_letters_set: HashSet<char> = necessary_letters.chars().collect();

    for letter in word.chars() {
        if necessary_letters_set.contains(&letter) {
            score += letter_rarity_scores.get(&letter).unwrap_or(&0.0);
        }
    }
    score
}

fn get_top_flip_words(
    dictionary: &[String],
    letter_rarity_scores: &HashMap<char, f64>,
    bonus_letters: &str,
    n: usize,
) -> Vec<(String, f64)> {
    // Remove capacity as we only need top n results
    let mut word_scores: Vec<(String, f64)> = dictionary
        .par_iter()
        .map(|word| {
            let score = evaluate_flip_word(word, letter_rarity_scores, bonus_letters);
            (word.clone(), (score * 100.0).round() / 100.0)
        })
        .collect();

    // Use a partial sort instead of full sort since we only need top n
    let n = n.min(word_scores.len());
    word_scores.select_nth_unstable_by(n - 1, |a, b| b.1.partial_cmp(&a.1).unwrap());
    word_scores.truncate(n);

    // Sort the top n results by score in descending order
    word_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    word_scores
}

fn evaluate_sn_word(word: &str, syllables_count: &HashMap<String, i32>) -> f64 {
    let word_syllables = split_word_into_syllables(word);
    let mut score = 0.0;

    for (syllable, count) in word_syllables {
        if let Some(&before_placing_word) = syllables_count.get(&syllable) {
            let after_placing_word = before_placing_word - count;
            let depletion_percentage =
                (before_placing_word - after_placing_word) as f64 / before_placing_word as f64;
            score += depletion_percentage * depletion_percentage;
        }
    }

    score
}

fn get_top_sn_words(
    dictionary: &[String],
    syllables_count: &HashMap<String, i32>,
    n: usize,
) -> Vec<(String, f64)> {
    // Remove capacity as we only need top n results
    let mut word_scores: Vec<(String, f64)> = dictionary
        .par_iter()
        .map(|word| {
            let score = evaluate_sn_word(word, syllables_count);
            (word.clone(), (score * 100.0).round() / 100.0)
        })
        .collect();

    // Use a partial sort instead of full sort since we only need top n
    let n = n.min(word_scores.len());
    word_scores.select_nth_unstable_by(n - 1, |a, b| b.1.partial_cmp(&a.1).unwrap());
    word_scores.truncate(n);

    // Sort the top n results by score in descending order
    word_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    word_scores
}

fn generate_dictionary_hash(words: &[String], language: &str) -> String {
    let mut hasher = Sha256::new();
    // Add language to the hash
    hasher.update(language.as_bytes());

    // Sample size for each section (beginning, middle, end)
    let sample_size = 100;
    let total_words = words.len();

    // Sample from beginning
    for word in words.iter().take(sample_size) {
        hasher.update(word.as_bytes());
    }

    // Sample from middle
    let middle_start = total_words / 2 - sample_size / 2;
    for word in words.iter().skip(middle_start).take(sample_size) {
        hasher.update(word.as_bytes());
    }

    // Sample from end
    let end_start = total_words.saturating_sub(sample_size);
    for word in words.iter().skip(end_start) {
        hasher.update(word.as_bytes());
    }

    // Add total word count to detect additions/removals
    hasher.update(total_words.to_string().as_bytes());

    format!("{:x}", hasher.finalize())
}

fn read_bbdm_file(file_path: &Path) -> io::Result<(String, serde_json::Value)> {
    let file = File::open(file_path)?;
    let mut reader = io::BufReader::new(file);

    // Read hash from first line
    let mut hash = String::new();
    reader.read_line(&mut hash)?;
    let hash = hash.trim().to_string();

    // Read JSON from remaining content
    let mut json_content = String::new();
    reader.read_to_string(&mut json_content)?;
    let metadata = serde_json::from_str(&json_content)?;

    Ok((hash, metadata))
}

fn write_bbdm_file(file_path: &Path, hash: &str, metadata: &serde_json::Value) -> io::Result<()> {
    let mut file = File::create(file_path)?;
    writeln!(file, "{}", hash)?;
    writeln!(file, "{}", serde_json::to_string(metadata)?)?;
    Ok(())
}

fn main() {
    let start_time = Instant::now();
    println!("Starting metadata generation...");

    let args: Vec<String> = env::args().collect();
    if args.len() != 4 {
        eprintln!(
            "Usage: {} <language> <dictionary_path> <output_dir>",
            args[0]
        );
        process::exit(1);
    }

    let language = &args[1];
    let dictionary_path = &args[2];
    let output_dir = &args[3];
    println!("Language: {}", language);
    println!("Dictionary path: {}", dictionary_path);
    println!("Output directory: {}", output_dir);

    // Read dictionary
    let words = match read_words_from_dictionary(dictionary_path) {
        Ok(words) => words,
        Err(e) => {
            eprintln!("Failed to read dictionary: {}", e);
            process::exit(1);
        }
    };
    println!("Read {} words from dictionary", words.len());

    // Generate hash
    let hash = generate_dictionary_hash(&words, language);
    println!("Generated dictionary hash: {}", hash);

    // Create output path
    let output_path = PathBuf::from(output_dir).join(format!("{}.bbdm", language));
    println!("Output path: {}", output_path.display());

    // Create output directory if it doesn't exist
    if let Some(parent) = output_path.parent() {
        println!("Creating directory: {}", parent.display());
        if let Err(e) = std::fs::create_dir_all(parent) {
            eprintln!("Failed to create output directory: {}", e);
            process::exit(1);
        }
    }

    // Check if file exists and compare hashes
    if output_path.exists() {
        match read_bbdm_file(&output_path) {
            Ok((existing_hash, _)) => {
                if existing_hash == hash {
                    println!("Cache hit: Dictionary hasn't changed");
                    let duration = start_time.elapsed();
                    println!(
                        "Operation completed in {:.2} seconds",
                        duration.as_secs_f64()
                    );
                    process::exit(0);
                } else {
                    println!("Cache miss: Dictionary has changed");
                }
            }
            Err(e) => {
                eprintln!("Error reading existing cache file: {}", e);
                process::exit(1);
            }
        }
    }

    // Generate metadata
    let mut bonus_letters_per_language = HashMap::new();
    bonus_letters_per_language.insert("fr".to_string(), "abcdefghijklmnopqrstuvxyz".to_string());
    bonus_letters_per_language.insert("en".to_string(), "abcdefghijklmnopqrstuvwy".to_string());
    bonus_letters_per_language.insert("de".to_string(), "abcdefghijklmnopqrstuvwy".to_string());
    bonus_letters_per_language.insert("brpt".to_string(), "abcdefghijlmnopqrstuvxz".to_string());
    bonus_letters_per_language.insert("es".to_string(), "abcdefghijlmnopqrstuvxyz".to_string());
    bonus_letters_per_language.insert("it".to_string(), "abcdefghilmnopqrstuz".to_string());

    let bonus_letters = match bonus_letters_per_language.get(language) {
        Some(letters) => letters,
        None => {
            eprintln!("Unsupported language: {}", language);
            process::exit(1);
        }
    };

    let letter_rarity_scores = get_letter_rarity_scores(&words, bonus_letters);
    let syllables_count = get_syllables_count(&words);
    let top_flip_words = get_top_flip_words(&words, &letter_rarity_scores, bonus_letters, 1000);
    let top_sn_words = get_top_sn_words(&words, &syllables_count, 1000);

    // Create metadata structure
    let metadata = serde_json::json!({
        "letterRarityScores": letter_rarity_scores,
        "syllablesCount": syllables_count,
        "topFlipWords": top_flip_words,
        "topSnWords": top_sn_words
    });

    // Write metadata to file
    println!("Writing metadata to file...");
    if let Err(e) = write_bbdm_file(&output_path, &hash, &metadata) {
        eprintln!("Failed to write metadata: {}", e);
        process::exit(1);
    }
    println!("Successfully wrote metadata to: {}", output_path.display());

    let duration = start_time.elapsed();
    println!(
        "Metadata generation completed in {:.2} seconds",
        duration.as_secs_f64()
    );
    process::exit(0);
}
