-- Add foreign key to bio_links table
ALTER TABLE IF EXISTS public.bio_links
    ADD CONSTRAINT bio_links_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.usuarios(id)
    ON DELETE CASCADE;

-- Update RLS policies
CREATE POLICY "Users can view their own bio links" ON public.bio_links
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_user_id
            FROM public.usuarios
            WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert their own bio links" ON public.bio_links
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id
            FROM public.usuarios
            WHERE id = user_id
        )
    );

CREATE POLICY "Users can update their own bio links" ON public.bio_links
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT auth_user_id
            FROM public.usuarios
            WHERE id = user_id
        )
    );

CREATE POLICY "Users can delete their own bio links" ON public.bio_links
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT auth_user_id
            FROM public.usuarios
            WHERE id = user_id
        )
    ); 