from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments, DataCollatorWithPadding
from ml.datasets.claimbuster import load_claimbuster

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
dataset = load_claimbuster()

def tokenize(batch):
    return tokenizer(batch["text"], truncation=True, max_length=128)

dataset = dataset.shuffle(seed=42).select(range(2000))
dataset = dataset.map(tokenize, batched=True)
dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

training_args = TrainingArguments(
    output_dir="backend/artifacts/claim_model",
    eval_strategy="epoch",
    save_strategy="epoch",
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=1,
    logging_dir="./logs",
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    eval_dataset=dataset,
    data_collator=data_collator
)
print("Training...\n")
trainer.train()
trainer.save_model("ml/artifacts/claim_model")
tokenizer.save_pretrained("ml/artifacts/claim_model")