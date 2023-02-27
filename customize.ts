#!/usr/bin/env -S deno run --unstable --allow-run --allow-read --allow-write

import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import * as colors from "https://deno.land/std@0.167.0/fmt/colors.ts";
import { parse } from "https://deno.land/std@0.167.0/flags/mod.ts";
import { File, Dir } from "https://deno.land/x/fs_pro@3.11.0/mod.ts";
import {
  pascalCase,
  snakeCase,
  paramCase,
  titleCase,
} from "https://deno.land/x/case@2.1.1/mod.ts";
import question from "https://raw.githubusercontent.com/ocpu/question-deno/master/mod.ts";
import { render } from "https://deno.land/x/mustache_ts@v0.4.1.1/mustache.ts";

interface Logger {
  info(s: string): void;
  error(s: string): void;
  warning(s: string): void;
}

const logger: Logger = {
  info: (s: string) => console.log("👉 " + colors.green(s)),
  error: (s: string) => console.error("💥 " + colors.red(s)),
  warning: (s: string) => console.error("🐓 " + colors.yellow(s)),
};

const args = parse(Deno.args);

if (args.help || args._.length < 1) {
  console.log(`Usage: ${path.basename(Deno.mainModule)} [PROJECT-NAME]`);
  Deno.exit(1);
}

try {
  await customizeProject(logger, args._[0].toString());
} catch (error) {
  logger.error(error.message);
  Deno.exit(1);
}

Deno.exit(0);

async function customizeProject(logger: Logger, projectName: string) {
  const binFile = new File("src/bin/rust_cli_quickstart.rs").rename(
    snakeCase(projectName) + ".rs"
  );
  const libFile = new File("src/lib.rs");
  const benchFile = new File("benches/benchmarks.rs");
  const cargoTomlFile = new File("Cargo.toml");
  const launchFile = new File(".vscode/launch.json");
  const readMeFile = new File("README.md");

  binFile.write(
    binFile
      .text()
      .replaceAll(RegExp("rust_cli_quickstart", "gm"), snakeCase(projectName))
      .replaceAll(RegExp("RustCliQuickStart", "gm"), pascalCase(projectName))
  );

  libFile.write(
    libFile
      .text()
      .replaceAll(RegExp("RustCliQuickStart", "gm"), pascalCase(projectName))
  );

  benchFile.write(
    benchFile
      .text()
      .replaceAll(RegExp("rust_cli_quickstart", "gm"), snakeCase(projectName))
      .replaceAll(RegExp("RustCliQuickStart", "gm"), pascalCase(projectName))
  );

  cargoTomlFile.write(
    cargoTomlFile
      .text()
      .replaceAll(RegExp("rust_cli_quickstart", "gm"), snakeCase(projectName))
      .replaceAll(RegExp("rust-cli-quickstart", "gm"), paramCase(projectName))
  );

  launchFile.write(
    launchFile
      .text()
      .replaceAll(RegExp("rust_cli_quickstart", "gm"), snakeCase(projectName))
      .replaceAll(RegExp("rust-cli-quickstart", "gm"), paramCase(projectName))
  );

  const description = await question(
    "input",
    "Enter the description for the project:"
  );
  const firstName = await question("input", "Enter your first name:");
  const lastName = await question("input", "Enter your last name:");
  const email = await question("input", "Enter your email:");
  const alias = await question("input", "Enter your GitHub alias:");

  cargoTomlFile.write(
    render(cargoTomlFile.text(), {
      description,
      firstName,
      lastName,
      email,
      alias,
    })
  );

  readMeFile.write(
    render(readMeFile.text(), {
      title: titleCase(projectName),
      alias,
      projectName: snakeCase(projectName),
      description,
    })
  );

  const deleteCustomizations = await question(
    "confirm",
    "Delete customization scripts?",
    true
  );

  if (deleteCustomizations) {
    new File("customize.ts").delete();
    new File("customize.bundle.ts").delete();
  }

  const reinitializeRepo = await question(
    "confirm",
    "Reinitialize Git repo?",
    true
  );

  if (reinitializeRepo) {
    new Dir(".git").delete();

    if ((await Deno.run({ cmd: ["git", "init"] }).status()).success) {
      logger.info("Git repo reinitialized");
    } else {
      logger.error("Unable to reinitialize Git repo");
      return;
    }

    if (
      (await Deno.run({ cmd: ["git", "add", "-A", ":/"] }).status()).success
    ) {
      logger.info("Staged first commit");
    } else {
      logger.error("Unable to stage first commit");
      return;
    }

    if (
      (
        await Deno.run({
          cmd: ["git", "commit", "-m", "'Initial commit'"],
        }).status()
      ).success
    ) {
      logger.info("Completed initial commit");
    } else {
      logger.error("Unable to complete first commit");
      return;
    }
  }

  logger.info("Customization complete.");
}
