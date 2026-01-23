-- Add bar_id to consumption table for tracking consumption per bar
ALTER TABLE public.consumption
ADD COLUMN bar_id INTEGER REFERENCES public.bars(id);

-- Create index for faster queries by bar
CREATE INDEX idx_consumption_bar_id ON public.consumption(bar_id);

-- Create composite index for participant + bar lookups
CREATE INDEX idx_consumption_participant_bar ON public.consumption(participant_id, bar_id);