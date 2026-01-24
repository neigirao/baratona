-- Drop the old unique constraint properly (it's a constraint, not just an index)
ALTER TABLE public.consumption DROP CONSTRAINT consumption_participant_id_type_key;

-- Create new unique constraint that includes bar_id to allow consumption per bar
-- Using COALESCE to handle NULL bar_id values properly in unique constraint
CREATE UNIQUE INDEX consumption_participant_type_bar_key 
ON public.consumption (participant_id, type, COALESCE(bar_id, -1));