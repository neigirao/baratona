-- Create check-ins table for bar arrivals
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  bar_id INTEGER NOT NULL REFERENCES public.bars(id),
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, bar_id)
);

-- Enable RLS
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies (public access for event app without auth)
CREATE POLICY "Anyone can view checkins" 
ON public.checkins FOR SELECT USING (true);

CREATE POLICY "Anyone can insert checkins" 
ON public.checkins FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete checkins" 
ON public.checkins FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;

-- Create index for faster lookups
CREATE INDEX idx_checkins_bar_id ON public.checkins(bar_id);
CREATE INDEX idx_checkins_participant_bar ON public.checkins(participant_id, bar_id);