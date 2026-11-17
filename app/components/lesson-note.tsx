import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import { describeNoteDraft, type NoteDraft } from "~/modules/lesson-notes";

const PLACEHOLDER = "Jot down what you want to remember from this lesson...";

export function LessonNote({
  note,
}: {
  note: { body: string; updatedAt: string } | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const savedBody = note?.body ?? "";
  const [body, setBody] = useState(savedBody);
  const draft = describeNoteDraft(body, savedBody);
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <LessonNoteHeader />

        <fetcher.Form method="post" className="space-y-2">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={PLACEHOLDER}
            aria-label="Your notes"
            rows={4}
            className="resize-y"
          />

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !draft.canSave}
            >
              {isSaving ? "Saving..." : "Save note"}
            </Button>

            <SaveStatus
              error={error}
              savedAt={draft.unsaved ? undefined : note?.updatedAt}
            />

            <CharacterCount draft={draft} />
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function LessonNoteHeader() {
  return (
    <div className="mb-4 flex items-center gap-2">
      <NotebookPen className="size-5 text-primary" />
      <h2 className="text-xl font-semibold">Your notes</h2>
      <span className="ml-auto flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Lock className="size-3" />
        Only you can see these
      </span>
    </div>
  );
}

function SaveStatus({ error, savedAt }: { error?: string; savedAt?: string }) {
  if (error) return <span className="text-sm text-destructive">{error}</span>;
  if (!savedAt) return null;
  return (
    <span suppressHydrationWarning className="text-xs text-muted-foreground">
      Saved {formatRelativeTime(savedAt)}
    </span>
  );
}

function CharacterCount({ draft }: { draft: NoteDraft }) {
  return (
    <span
      className={cn(
        "ml-auto text-xs",
        draft.tooLong ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {draft.length} / {draft.max}
    </span>
  );
}
