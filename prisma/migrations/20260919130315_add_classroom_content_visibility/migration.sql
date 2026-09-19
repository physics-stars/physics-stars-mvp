-- CreateTable
CREATE TABLE "classroom_hidden_worlds" (
    "classroomId" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,

    CONSTRAINT "classroom_hidden_worlds_pkey" PRIMARY KEY ("classroomId","worldId")
);

-- CreateTable
CREATE TABLE "classroom_hidden_levels" (
    "classroomId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,

    CONSTRAINT "classroom_hidden_levels_pkey" PRIMARY KEY ("classroomId","levelId")
);

-- AddForeignKey
ALTER TABLE "classroom_hidden_worlds" ADD CONSTRAINT "classroom_hidden_worlds_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_hidden_worlds" ADD CONSTRAINT "classroom_hidden_worlds_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_hidden_levels" ADD CONSTRAINT "classroom_hidden_levels_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_hidden_levels" ADD CONSTRAINT "classroom_hidden_levels_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
