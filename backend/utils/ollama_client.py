import asyncio
from asyncio.subprocess import PIPE, create_subprocess_exec
import subprocess

async def call_ollama_model(prompt: str) -> str:
    loop = asyncio.get_running_loop()

    def run_blocking_subprocess():
        proc = subprocess.Popen(
            ["ollama", "run", "qwen2.5:0.5b"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        stdout, stderr = proc.communicate(input=prompt)
        if proc.returncode != 0:
            raise RuntimeError(f"Ollama CLI failed: {stderr.strip()}")
        return stdout.strip()

    result = await loop.run_in_executor(None, run_blocking_subprocess)
    return result
