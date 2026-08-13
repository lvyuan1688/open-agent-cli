use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "open-agent-cli", version, about = "Coding-agent CLI with gRPC headless mode")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Start headless gRPC server
    Serve { #[arg(default_value = "0.0.0.0:50051")] addr: String },
    /// Attach TUI client to a running headless server
    Tui { #[arg(default_value = "http://127.0.0.1:50051")] server: String },
    /// Run a one-shot prompt through the headless server
    Run { prompt: String },
}

fn main() {
    let cli = Cli::parse();
    match cli.cmd {
        Cmd::Serve { addr } => println!("[serve] headless gRPC server on {addr} (stub)"),
        Cmd::Tui { server } => println!("[tui] attaching to {server} (stub)"),
        Cmd::Run { prompt } => println!("[run] prompt: {prompt} (stub)"),
    }
}
