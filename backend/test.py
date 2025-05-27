import asyncio
from asyncio.subprocess import PIPE, create_subprocess_exec

async def call_ollama_model(prompt: str) -> str:
    process = await create_subprocess_exec(
        "ollama",
        "run",
        "qwen2.5:0.5b",
        stdin=PIPE,
        stdout=PIPE,
        stderr=PIPE,
    )
    stdout, stderr = await process.communicate(input=prompt.encode())
    if process.returncode != 0:
        err = stderr.decode()
        raise RuntimeError(f"Ollama CLI failed: {err}")
    return stdout.decode().strip()

async def main():
    prompt = "I have question: What is AI? And LLM-generated answer: AI is intelligence demonstrated by machines. Improve that answer."
    response = await call_ollama_model(prompt)
    print("Response from Ollama model:")
    print(response)

if __name__ == "__main__":
    asyncio.run(main())
