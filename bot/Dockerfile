FROM rust:1.84
WORKDIR /app
COPY . .
RUN cargo build --release
CMD ["./target/release/bot"]