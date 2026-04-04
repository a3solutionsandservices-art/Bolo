"""
Seed a demo account for investor demos.

Usage (Railway one-off command):
    python scripts/seed_demo.py

What it does:
- Creates demo@bolo.ai user with workspace "Bolo Demo"
- Creates a sample Knowledge Base with Indian e-commerce FAQs
- Creates 6 sample conversations showing Hindi, Tamil, Telugu interactions
- Safe to re-run: skips if demo account already exists
"""

import asyncio
import logging
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

DEMO_EMAIL = "demo@bolo.ai"
DEMO_PASSWORD = "BoloDemo@2026!"
DEMO_FULL_NAME = "Bolo Demo"
DEMO_TENANT_NAME = "Bolo Demo Workspace"
DEMO_TENANT_SLUG = "bolo-demo"


DEMO_CONVERSATIONS = [
    {
        "mode": "CONVERSATION",
        "source_language": "hi-IN",
        "target_language": "hi-IN",
        "summary": "Hindi customer asking about order status",
        "messages": [
            {"role": "user", "content": "मेरा ऑर्डर कहाँ है? ऑर्डर नंबर #4521 है।", "language": "hi-IN"},
            {"role": "assistant", "content": "आपका ऑर्डर #4521 रास्ते में है और कल शाम 6 बजे तक पहुँच जाएगा। आपको SMS अपडेट मिलेगा।", "language": "hi-IN"},
            {"role": "user", "content": "क्या मैं डिलीवरी का समय बदल सकता हूँ?", "language": "hi-IN"},
            {"role": "assistant", "content": "बिल्कुल! आप अपनी ऐप में जाकर डिलीवरी का समय सुबह 10 बजे से शाम 8 बजे के बीच बदल सकते हैं। क्या आप चाहेंगे कि मैं यह अभी करूँ?", "language": "hi-IN"},
        ],
    },
    {
        "mode": "CONVERSATION",
        "source_language": "ta-IN",
        "target_language": "ta-IN",
        "summary": "Tamil customer requesting a refund",
        "messages": [
            {"role": "user", "content": "என் ஆர்டர் #7832 தவறான பொருள் வந்தது. திரும்பப் பெற வேண்டும்.", "language": "ta-IN"},
            {"role": "assistant", "content": "மன்னிக்கவும்! ஆர்டர் #7832 க்கு உடனடியாக திரும்பப் பெறுதல் தொடங்குகிறோம். 3-5 நாட்களில் பணம் திரும்பி வரும்.", "language": "ta-IN"},
            {"role": "user", "content": "சரி, நன்றி. எனக்கு உறுதிப்படுத்தல் SMS வருமா?", "language": "ta-IN"},
            {"role": "assistant", "content": "ஆம்! உங்கள் பதிவுசெய்யப்பட்ட எண்ணுக்கு SMS உறுதிப்படுத்தல் 10 நிமிடத்தில் வரும். மேலும் உதவி வேண்டுமா?", "language": "ta-IN"},
        ],
    },
    {
        "mode": "CONVERSATION",
        "source_language": "te-IN",
        "target_language": "te-IN",
        "summary": "Telugu customer product inquiry",
        "messages": [
            {"role": "user", "content": "నాకు 500 రూపాయల లోపు చీర కావాలి. పెళ్లికి వెళ్ళాలి.", "language": "te-IN"},
            {"role": "assistant", "content": "మీకు అనువైన 12 చీరలు ఉన్నాయి! కాంచీపురం సిల్క్ ₹450లో, బెనారస్ కాటన్ ₹380లో అందుబాటులో ఉన్నాయి. ఏ రంగు ఇష్టం?", "language": "te-IN"},
            {"role": "user", "content": "లైట్ పింక్ లేదా గోల్డ్ కలర్ అయితే బాగుంటుంది.", "language": "te-IN"},
            {"role": "assistant", "content": "లైట్ పింక్ కాంచీపురం సిల్క్ ₹450 మీకు బాగా సరిపోతుంది! దానిని కార్ట్‌కు జోడించనా?", "language": "te-IN"},
        ],
    },
    {
        "mode": "TRANSLATION",
        "source_language": "en-IN",
        "target_language": "hi-IN",
        "summary": "English to Hindi translation — loan application",
        "messages": [
            {"role": "user", "content": "I want to apply for a personal loan of 2 lakh rupees.", "language": "en-IN"},
            {"role": "assistant", "content": "मैं 2 लाख रुपये का व्यक्तिगत ऋण लेना चाहता हूँ।", "language": "hi-IN"},
            {"role": "user", "content": "What documents do I need?", "language": "en-IN"},
            {"role": "assistant", "content": "मुझे किन दस्तावेज़ों की ज़रूरत होगी?", "language": "hi-IN"},
        ],
    },
    {
        "mode": "CONVERSATION",
        "source_language": "bn-IN",
        "target_language": "bn-IN",
        "summary": "Bengali customer — medication reminder",
        "messages": [
            {"role": "user", "content": "আমার ডায়াবেটিসের ওষুধের রিমাইন্ডার সেট করুন, প্রতিদিন সকাল ৮টায়।", "language": "bn-IN"},
            {"role": "assistant", "content": "ঠিক আছে! প্রতিদিন সকাল ৮টায় আপনার ডায়াবেটিস ওষুধের রিমাইন্ডার সেট করা হয়েছে। আর কোনো সাহায্য দরকার?", "language": "bn-IN"},
        ],
    },
    {
        "mode": "CONVERSATION",
        "source_language": "kn-IN",
        "target_language": "kn-IN",
        "summary": "Kannada customer — crop advisory",
        "messages": [
            {"role": "user", "content": "ನನ್ನ ಟೊಮ್ಯಾಟೊ ಬೆಳೆಗೆ ಕೀಟಗಳ ಸಮಸ್ಯೆ ಇದೆ. ಏನು ಮಾಡಬೇಕು?", "language": "kn-IN"},
            {"role": "assistant", "content": "ಟೊಮ್ಯಾಟೊ ಬೆಳೆಗೆ ನೀಮ್ ಎಣ್ಣೆ ದ್ರಾವಣ (5 ಮಿಲಿ/ಲೀಟರ್) ಸಿಂಪಡಿಸಿ. ಪ್ರತಿ 7 ದಿನಕ್ಕೊಮ್ಮೆ ಮಾಡಿ. ಮಳೆಯ ನಂತರ ತಕ್ಷಣ ಸಿಂಪಡಿಸಬೇಡಿ.", "language": "kn-IN"},
            {"role": "user", "content": "ನೀಮ್ ಎಣ್ಣೆ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?", "language": "kn-IN"},
            {"role": "assistant", "content": "ಸ್ಥಳೀಯ ಕೃಷಿ ಅಂಗಡಿಯಲ್ಲಿ ₹80-120/ಲೀಟರ್‌ಗೆ ಸಿಗುತ್ತದೆ. ಅಥವಾ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಬಹುದು.", "language": "kn-IN"},
        ],
    },
]

DEMO_KB_DOCS = [
    {
        "title": "Order Tracking & Delivery FAQ",
        "content": """
# Order Tracking & Delivery

**How do I track my order?**
You can track your order using the order number sent in your confirmation SMS. Visit our tracking page or ask our AI assistant.

**When will my order arrive?**
Standard delivery takes 2-5 business days. Express delivery is available in major cities within 24 hours.

**Can I change my delivery address?**
Yes, you can change the delivery address up to 2 hours after placing the order by contacting our support.

**What if I am not home during delivery?**
The delivery agent will attempt delivery 3 times. You can also reschedule via SMS or our app.
""",
    },
    {
        "title": "Returns & Refunds Policy",
        "content": """
# Returns & Refunds

**How do I return a product?**
Products can be returned within 7 days of delivery if unused and in original packaging.

**When will I get my refund?**
Refunds are processed within 3-5 business days after we receive the returned item.

**What if I received the wrong item?**
Contact our support immediately. We will arrange a pickup and send the correct item at no extra charge.

**Are there any non-returnable items?**
Perishable goods, digital products, and customized items cannot be returned.
""",
    },
    {
        "title": "Payment & Pricing FAQ",
        "content": """
# Payment & Pricing

**What payment methods do you accept?**
We accept UPI, credit/debit cards, net banking, EMI, and cash on delivery in most pin codes.

**Is my payment information secure?**
Yes. We use 256-bit SSL encryption and are PCI-DSS compliant. We never store your card details.

**Can I pay in EMI?**
EMI is available on orders above ₹3,000 with major credit cards and select debit cards.

**Why was my payment declined?**
Check your bank balance, card limit, or try a different payment method. Contact your bank if the issue persists.
""",
    },
]


async def seed():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    import os

    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        from dotenv import load_dotenv
        load_dotenv()
        DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://bolo:bolo@localhost:5432/bolo")

    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from app.models.user import User, UserRole
    from app.models.tenant import Tenant
    from app.models.knowledge_base import KnowledgeBase, KnowledgeDocument
    from app.models.conversation import Conversation, Message, ConversationStatus, ConversationMode
    from app.core.security import get_password_hash

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        existing = result.scalar_one_or_none()
        if existing:
            log.info("Demo account already exists — skipping user/tenant creation")
            tenant_id = existing.tenant_id
        else:
            log.info("Creating demo tenant...")
            tenant = Tenant(
                id=uuid.uuid4(),
                name=DEMO_TENANT_NAME,
                slug=DEMO_TENANT_SLUG,
                plan_tier="growth",
                is_active=True,
                widget_config={
                    "theme": "dark",
                    "primary_color": "#FF6B00",
                    "language": "hi-IN",
                    "welcome_message": "नमस्ते! मैं बोलो हूँ। आपकी कैसे मदद करूँ?",
                },
            )
            db.add(tenant)
            await db.flush()
            tenant_id = tenant.id

            log.info("Creating demo user...")
            user = User(
                id=uuid.uuid4(),
                email=DEMO_EMAIL,
                full_name=DEMO_FULL_NAME,
                hashed_password=get_password_hash(DEMO_PASSWORD),
                role=UserRole.TENANT_ADMIN,
                tenant_id=tenant_id,
                is_active=True,
            )
            db.add(user)
            await db.flush()

        result = await db.execute(
            select(KnowledgeBase).where(
                KnowledgeBase.tenant_id == tenant_id,
                KnowledgeBase.name == "Customer Support FAQ",
            )
        )
        existing_kb = result.scalar_one_or_none()

        if existing_kb:
            log.info("Knowledge base already exists — skipping KB creation")
            kb_id = existing_kb.id
        else:
            log.info("Creating demo knowledge base...")
            kb = KnowledgeBase(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name="Customer Support FAQ",
                description="Pre-loaded FAQ for D2C e-commerce — order tracking, returns, payments",
                languages=["hi-IN", "ta-IN", "te-IN", "en-IN"],
                document_count=len(DEMO_KB_DOCS),
                is_active=True,
            )
            db.add(kb)
            await db.flush()
            kb_id = kb.id

            for doc_data in DEMO_KB_DOCS:
                doc = KnowledgeDocument(
                    id=uuid.uuid4(),
                    knowledge_base_id=kb_id,
                    title=doc_data["title"],
                    content=doc_data["content"],
                    language="en-IN",
                    is_indexed=True,
                    chunk_count=3,
                )
                db.add(doc)

        result = await db.execute(
            select(Conversation).where(Conversation.tenant_id == tenant_id)
        )
        existing_convs = result.scalars().all()

        if existing_convs:
            log.info(f"Found {len(existing_convs)} existing conversations — skipping conversation seeding")
        else:
            log.info("Creating demo conversations...")
            base_time = datetime.now(timezone.utc) - timedelta(days=3)

            for i, conv_data in enumerate(DEMO_CONVERSATIONS):
                conv_time = base_time + timedelta(hours=i * 4)
                conv = Conversation(
                    id=uuid.uuid4(),
                    tenant_id=tenant_id,
                    mode=conv_data["mode"],
                    source_language=conv_data["source_language"],
                    target_language=conv_data["target_language"],
                    status=ConversationStatus.ENDED,
                    message_count=len(conv_data["messages"]),
                    created_at=conv_time,
                    ended_at=conv_time + timedelta(minutes=5 + i),
                    caller_metadata={
                        "channel": "widget",
                        "demo": True,
                        "summary": conv_data["summary"],
                    },
                )
                db.add(conv)
                await db.flush()

                for j, msg_data in enumerate(conv_data["messages"]):
                    msg = Message(
                        id=uuid.uuid4(),
                        conversation_id=conv.id,
                        role=msg_data["role"],
                        content=msg_data["content"],
                        language=msg_data["language"],
                        created_at=conv_time + timedelta(seconds=j * 12),
                    )
                    db.add(msg)

        await db.commit()
        log.info("✅ Demo seed complete!")
        log.info(f"   Email:    {DEMO_EMAIL}")
        log.info(f"   Password: {DEMO_PASSWORD}")
        log.info(f"   Tenant:   {DEMO_TENANT_SLUG}")


if __name__ == "__main__":
    asyncio.run(seed())
