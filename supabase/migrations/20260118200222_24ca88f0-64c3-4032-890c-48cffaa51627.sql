-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bars table
CREATE TABLE public.bars (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  bar_order INTEGER NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- Create app_config table (singleton)
CREATE TABLE public.app_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status TEXT NOT NULL DEFAULT 'at_bar' CHECK (status IN ('at_bar', 'in_transit')),
  current_bar_id INTEGER REFERENCES public.bars(id),
  origin_bar_id INTEGER REFERENCES public.bars(id),
  destination_bar_id INTEGER REFERENCES public.bars(id),
  global_delay_minutes INTEGER NOT NULL DEFAULT 0,
  broadcast_msg TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  bar_id INTEGER NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  drink_score INTEGER NOT NULL CHECK (drink_score >= 1 AND drink_score <= 5),
  food_score INTEGER NOT NULL CHECK (food_score >= 1 AND food_score <= 5),
  vibe_score INTEGER NOT NULL CHECK (vibe_score >= 1 AND vibe_score <= 5),
  service_score INTEGER NOT NULL CHECK (service_score >= 1 AND service_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, bar_id)
);

-- Create consumption table
CREATE TABLE public.consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('drink', 'food')),
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, type)
);

-- Enable Row Level Security (public read/write for this party app - no auth needed)
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (party app - everyone can read/write)
CREATE POLICY "Anyone can view participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participants" ON public.participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view bars" ON public.bars FOR SELECT USING (true);

CREATE POLICY "Anyone can view app_config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Anyone can update app_config" ON public.app_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert app_config" ON public.app_config FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON public.votes FOR UPDATE USING (true);

CREATE POLICY "Anyone can view consumption" ON public.consumption FOR SELECT USING (true);
CREATE POLICY "Anyone can insert consumption" ON public.consumption FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update consumption" ON public.consumption FOR UPDATE USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consumption;

-- Insert seed data: Bars
INSERT INTO public.bars (id, name, address, scheduled_time, bar_order, latitude, longitude) VALUES
(1, 'Pavão Azul', 'R. Hilário de Gouveia, 71 - Copa', '15:00', 1, -22.9674, -43.1868),
(2, 'Chanchada', 'R. Gen. Polidoro, 164 - Bota', '16:20', 2, -22.9519, -43.1869),
(3, 'Rio Tap Beer House', 'Tv. dos Tamoios, 32 - Flamengo', '17:30', 3, -22.9328, -43.1749),
(4, 'Suru', 'R. da Lapa, 151 - Lapa', '19:00', 4, -22.9119, -43.1807),
(5, 'Bar da Frente', 'R. Barão de Iguatemi, 388 - Pça Band', '20:20', 5, -22.9158, -43.1799),
(6, 'Noo Cachaçaria', 'R. Barão de Iguatemi, 458 - Pça Band', '21:30', 6, -22.9155, -43.1795),
(7, 'Bar Miudinho', 'R. Dona Maria, 68 - Tijuca', '22:45', 7, -22.9224, -43.2323),
(8, 'Baródromo', 'R. Dona Zulmira, 115 - Maraca', '23:55', 8, -22.9121, -43.2292),
(9, 'Fregola', 'R. Geminiano Góis, 70 - Freguesia', '01:30', 9, -22.9422, -43.3425);

-- Insert seed data: Participants
INSERT INTO public.participants (name, is_admin) VALUES
('Nei', true),
('Carmen', false),
('Thiago', false),
('Aneta', false),
('Alexandre', false),
('Neide', false),
('Marcão', false),
('Pedrinho', false),
('Mari', false),
('Felipe Messner', false),
('Roberto', false),
('Esposa do Roberto', false),
('Fabi', false),
('Luciano', false),
('Marcio', false),
('Fatima', false),
('Bruno', false),
('Haroldo', false),
('Aline', false),
('Marco', false),
('Analice', false),
('Ney', false),
('Katia', false),
('Miguel', false);

-- Insert initial app_config
INSERT INTO public.app_config (id, status, current_bar_id, global_delay_minutes) 
VALUES (1, 'at_bar', 1, 0);

-- Initialize consumption for all participants
INSERT INTO public.consumption (participant_id, type, count)
SELECT p.id, t.type, 0
FROM public.participants p
CROSS JOIN (VALUES ('drink'), ('food')) AS t(type);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consumption_updated_at
  BEFORE UPDATE ON public.consumption
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();