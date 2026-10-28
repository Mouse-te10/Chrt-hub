FROM python:3.10-slim

WORKDIR /backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Явно прописываем PYTHONPATH, чтобы Python видел папку app из любого места
ENV PYTHONPATH=/backend

# Запускаем uvicorn, указывая правильный путь к модулю main через точку
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
