import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import * as fs from "fs";
import * as path from "path";
import { schemasDir } from "./paths";
import { CliError } from "../providers/wavespeed/types";
import type { VideoDoc } from "./video-types";

type ValidateFn = ((data: unknown) => boolean) & { errors?: unknown };

let validateFn: ValidateFn | null = null;

function getValidate(): ValidateFn {
  if (!validateFn) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const schema = JSON.parse(
      fs.readFileSync(path.join(schemasDir(), "video.schema.json"), "utf8"),
    ) as object;
    validateFn = ajv.compile(schema) as ValidateFn;
  }
  return validateFn;
}

export function validateVideoDoc(video: VideoDoc): void {
  // DEC-42 / TECH-TEST-023: field music dilarang
  if ("music" in video && (video as { music?: unknown }).music != null) {
    throw new CliError(
      "ERR-SCHEMA",
      `Field "music" is not allowed (DEC-42). Use SFX + optional sung beat instead.`,
    );
  }

  const validate = getValidate();
  if (!validate(video)) {
    const details = JSON.stringify(validate.errors, null, 2);
    throw new CliError("ERR-SCHEMA", `video.json invalid:\n${details}`);
  }

  const pacing = video.pacing ?? (video.scenes?.length ? "scene" : "grid");

  if (pacing === "scene") {
    if (!video.scenes?.length) {
      throw new CliError(
        "ERR-SCHEMA",
        `pacing=scene requires scenes[] (DEC-57)`,
      );
    }
    const sceneIds = new Set<string>();
    const sungBeats = new Set<string>();
    for (const scene of video.scenes) {
      if (sceneIds.has(scene.id)) {
        throw new CliError("ERR-SCHEMA", `Duplicate scene id ${scene.id}`);
      }
      sceneIds.add(scene.id);
      if (scene.delivery === "sung") {
        // Beberapa scene B6 (langkah jingle) boleh sung — max 1 beat sung
        const beatRoot = scene.beatId.split("+")[0] ?? scene.beatId;
        sungBeats.add(beatRoot);
      }
    }
    if (sungBeats.size > 1) {
      throw new CliError(
        "ERR-SCHEMA",
        `At most 1 sung beat allowed (found ${[...sungBeats].join(", ")})`,
      );
    }
    return;
  }

  if (!video.beats?.length) {
    throw new CliError(
      "ERR-SCHEMA",
      `Legacy pacing requires beats[] (or set pacing=scene with scenes[])`,
    );
  }

  const beatIds = new Set<string>();
  let sungCount = 0;
  for (const beat of video.beats) {
    if (beatIds.has(beat.id)) {
      throw new CliError("ERR-SCHEMA", `Duplicate beat id ${beat.id}`);
    }
    beatIds.add(beat.id);
    if (beat.delivery === "sung") {
      sungCount += 1;
      if ((beat.minSlots ?? 1) < 2) {
        throw new CliError(
          "ERR-SCHEMA",
          `Beat ${beat.id} delivery=sung requires minSlots >= 2`,
        );
      }
    }
  }
  if (sungCount > 1) {
    throw new CliError(
      "ERR-SCHEMA",
      `At most 1 sung beat allowed (found ${sungCount})`,
    );
  }
}
