pub struct Dictionary {
    pub list: Vec<String>,
}

impl Dictionary {
    pub fn new() -> Self {
        return Self { list: vec![] };
    }
    pub fn load(&mut self, src_file: &str) {
        let content = std::fs::read_to_string(src_file).expect("Could not read file");
        for line in content.lines() {
            self.list.push(line.to_string());
        }
    }
}
