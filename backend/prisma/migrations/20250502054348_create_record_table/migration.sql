-- CreateTable
CREATE TABLE "Record" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);
