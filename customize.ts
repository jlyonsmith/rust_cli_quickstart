#!/usr/bin/env -S deno run --unstable --allow-run --allow-read --allow-write
import {
  Command,
  ValidationError,
} from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import {
  snakeCase,
  titleCase,
  paramCase,
  pascalCase,
} from "https://deno.land/x/case@2.1.1/mod.ts";
import * as fs from "https://deno.land/std@0.191.0/fs/mod.ts";
import {
  Input,
  Confirm,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import { Karacho } from "https://deno.land/x/karacho/main.ts";

await new Command()
  .name("customize.ts")
  .version("1.0.0")
  .description("Customizes the Rust template")
  .arguments("<PROJECTNAME:string>")
  .error((error) => {
    if (error instanceof ValidationError) {
      console.error(error);
      Deno.exit(1);
    }
  })
  .action(async (_options, args) => {
    const projectName = args;
    const projectNameSnake = snakeCase(projectName);
    const projectNamePascal = pascalCase(projectName);
    const projectNameTitle = titleCase(projectName);
    const projectNameParam = paramCase(projectName);
    const oldBinPath = "src/bin/rust_cli_quickstart.rs";
    const binPath = `src/bin/${snakeCase(projectName)}.rs`;
    const libPath = "src/lib.rs";
    const benchPath = "benches/benchmarks.rs";
    const cargoTomlPath = "Cargo.toml";
    const launchPath = ".vscode/launch.json";
    const readMePath = "README.md";

    fs.moveSync(oldBinPath, binPath);

    Deno.writeTextFileSync(
      binPath,
      Deno.readTextFileSync(binPath)
        .replaceAll("rust_cli_quickstart", projectNameSnake)
        .replaceAll("RustCliQuickStart", projectNamePascal)
    );

    Deno.writeTextFileSync(
      libPath,
      Deno.readTextFileSync(libPath).replaceAll(
        "RustCliQuickStart",
        projectNamePascal
      )
    );

    Deno.writeTextFileSync(
      benchPath,
      Deno.readTextFileSync(benchPath)
        .replaceAll("rust_cli_quickstart", projectNameSnake)
        .replaceAll("RustCliQuickStart", projectNamePascal)
    );

    Deno.writeTextFileSync(
      launchPath,
      Deno.readTextFileSync(launchPath)
        .replaceAll("rust_cli_quickstart", projectNameSnake)
        .replaceAll("RustCliQuickStart", projectNamePascal)
    );

    const description = await Input.prompt(
      "Enter the description for the project"
    );
    const firstName = await Input.prompt("Enter your first name");
    const lastName = await Input.prompt("Enter your last name");
    const email = await Input.prompt("Enter your email");
    const alias = await Input.prompt("Enter your GitHub alias");
    const karacho = new Karacho();

    Deno.writeTextFileSync(
      cargoTomlPath,
      karacho.compile(
        Deno.readTextFileSync(cargoTomlPath)
          .replaceAll("rust_cli_quickstart", projectNameSnake)
          .replaceAll("rust-cli-quickstart", projectNameParam)
          .replaceAll("RustCliQuickStart", projectNamePascal)
      )({ description, firstName, lastName, email, alias })
    );

    Deno.writeTextFile(
      readMePath,
      karacho.compile(Deno.readTextFileSync(readMePath))({
        title: projectNameTitle,
        alias,
        projectName: projectNameSnake,
        description,
      })
    );

    if (await Confirm.prompt("Delete customization scripts?")) {
      Deno.removeSync("customize.ts");
    }

    if (await Confirm.prompt("Re-initialize Git repo?")) {
      Deno.removeSync(".git");
      await new Deno.Command("git", { args: ["init"] }).spawn().status;
      await new Deno.Command("git", { args: ["add", "-A", ":/"] }).spawn()
        .status;
      await new Deno.Command("git", {
        args: ["commit", "-m", "Initial commit"],
      }).spawn().status;
    }
  })
  .parse(Deno.args);
