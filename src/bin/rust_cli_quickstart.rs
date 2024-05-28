use core::fmt::Arguments;
use rust_cli_quickstart::{error, RustCliQuickStartLog, RustCliQuickStartTool};
use yansi::Paint;

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
        eprintln!("{}", Paint::yellow(&format!("warning: {}", args)));
    }
    fn error(self: &Self, args: Arguments) {
        eprintln!("{}", Paint::red(&format!("error: {}", args)));
    }
}

fn main() {
    let logger = RustCliQuickStartLogger::new();

    if let Err(error) = RustCliQuickStartTool::new(&logger).run(std::env::args_os()) {
        error!(logger, "{}", error);
        std::process::exit(1);
    }
}
