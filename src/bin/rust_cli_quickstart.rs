use colored::Colorize;
use core::fmt::Arguments;
use rust_cli_quickstart::{error, RustCliQuickStartLog, RustCliQuickStartTool};

struct RustCliQuickStartLogger;

impl RustCliQuickStartLogger {
    fn new() -> RustCliQuickStartLogger {
        RustCliQuickStartLogger {}
    }
}

impl RustCliQuickStartLog for RustCliQuickStartLogger {
    fn output(self: &Self, args: Arguments) {
        println!("{}", args);
    }
    fn warning(self: &Self, args: Arguments) {
        eprintln!("{}", format!("warning: {}", args).yellow());
    }
    fn error(self: &Self, args: Arguments) {
        eprintln!("{}", format!("error: {}", args).red());
    }
}

fn main() {
    let logger = RustCliQuickStartLogger::new();

    if let Err(error) = RustCliQuickStartTool::new(&logger).run(std::env::args_os()) {
        error!(logger, "{}", error);
        std::process::exit(1);
    }
}
