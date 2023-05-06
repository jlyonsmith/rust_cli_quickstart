#!/usr/bin/env rust-script
//! ```cargo
//! [dependencies]
//! yansi = "0.5.1"
//! str_inflector = "0.12.0"
//! dialoguer = "0.10.3"
//! handlebars = "4.3.6"
//! map-macro = "0.2.5"
//! duct = "0.13.6"
//! ```

use dialoguer::{Confirm, Input};
use duct::cmd;
use handlebars::Handlebars;
use inflector::Inflector;
use map_macro::map;
use std::{env, error::Error, fs, process::ExitCode};
use yansi::Paint;

trait Logger {
    fn info<T: AsRef<str>>(s: T);
    fn error<T: AsRef<str>>(s: T);
    fn warning<T: AsRef<str>>(s: T);
}

struct Customizer {}

impl Logger for Customizer {
    fn info<T: AsRef<str>>(s: T) {
        println!("👉 {}", s.as_ref());
    }

    fn error<T: AsRef<str>>(s: T) {
        eprintln!("💥 {}", Paint::red(s.as_ref()));
    }

    fn warning<T: AsRef<str>>(s: T) {
        eprintln!("🐓 {}", Paint::yellow(s.as_ref()));
    }
}

impl Customizer {
    fn new() -> Customizer {
        Customizer {}
    }

    fn run(&self, project_name: &str) -> Result<(), Box<dyn Error>> {
        let project_name_snake = project_name.to_snake_case();
        let project_name_pascal = project_name.to_pascal_case();
        let project_name_title = project_name.to_title_case();
        let project_name_kebab = project_name.to_kebab_case();
        let old_bin_path = "src/bin/rust_cli_quickstart.rs";
        let bin_path = format!("src/bin/{}.rs", &project_name.to_snake_case());
        let lib_path = "src/lib.rs";
        let bench_path = "benches/benchmarks.rs";
        let cargo_toml_path = "Cargo.toml";
        let launch_path = ".vscode/launch.json";
        let read_me_path = "README.md";

        fs::rename(old_bin_path, &bin_path)?;

        fs::write(
            &bin_path,
            fs::read_to_string(&bin_path)?
                .replace("rust_cli_quickstart", &project_name_snake)
                .replace("RustCliQuickStart", &project_name_pascal),
        )?;

        fs::write(
            &lib_path,
            fs::read_to_string(&lib_path)?.replace("RustCliQuickStart", &project_name_pascal),
        )?;

        fs::write(
            &bench_path,
            fs::read_to_string(&bench_path)?
                .replace("rust_cli_quickstart", &project_name_snake)
                .replace("RustCliQuickStart", &project_name_pascal),
        )?;

        fs::write(
            &cargo_toml_path,
            fs::read_to_string(&cargo_toml_path)?
                .replace("rust_cli_quickstart", &project_name_snake)
                .replace("rust-cli-quickstart", &project_name_kebab)
                .replace("RustCliQuickStart", &project_name_pascal),
        )?;

        fs::write(
            &launch_path,
            fs::read_to_string(&launch_path)?
                .replace("rust_cli_quickstart", &project_name.to_snake_case())
                .replace("RustCliQuickStart", &project_name.to_pascal_case()),
        )?;

        let description = Input::<String>::new()
            .with_prompt("Enter the description for the project")
            .interact_text()?;
        let first_name = Input::<String>::new()
            .with_prompt("Enter your first name")
            .interact_text()?;
        let last_name = Input::<String>::new()
            .with_prompt("Enter your last name")
            .interact_text()?;
        let email = Input::<String>::new()
            .with_prompt("Enter your email")
            .interact_text()?;
        let alias = Input::<String>::new()
            .with_prompt("Enter your GitHub alias")
            .interact_text()?;

        let handlebars = Handlebars::new();

        fs::write(
            &cargo_toml_path,
            &handlebars.render_template(
                &fs::read_to_string(&cargo_toml_path)?,
                &map! {
                    "description" => &description,
                    "firstName" => &first_name,
                    "lastName" => &last_name,
                    "email" => &email,
                    "alias" => &alias,
                },
            )?,
        )?;

        fs::write(
            &read_me_path,
            &handlebars.render_template(
                &fs::read_to_string(&read_me_path)?,
                &map! {
                    "title" => &project_name_title,
                    "alias" => &alias,
                    "projectName" => &project_name_snake,
                    "description" => &description,
                },
            )?,
        )?;

        if Confirm::new()
            .with_prompt("Delete customization scripts?")
            .interact()?
        {
            fs::remove_file("customize.rs")?;
        }

        if Confirm::new()
            .with_prompt("Reinitialize Git repo?")
            .interact()?
        {
            fs::remove_dir_all(".git")?;
            cmd!("git", "init").run()?;
            cmd!("git", "add", "-A", ":/").run()?;
            cmd!("git", "commit", "-m", "Initial commit").run()?;
        }

        Self::info("Customization complete");

        Ok(())
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();
    let customizer = Customizer::new();

    if args.len() < 2 {
        eprintln!("Usage: customize [PROJECT-NAME]");
        return ExitCode::SUCCESS;
    }

    if let Err(err) = customizer.run(&args[1]) {
        Customizer::error(&err.to_string());
        return ExitCode::FAILURE;
    }

    ExitCode::SUCCESS
}
